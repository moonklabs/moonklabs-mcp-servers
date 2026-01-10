/**
 * BMAD 에이전트 .md 파일 파싱
 *
 * 에이전트 파일 구조:
 * - YAML frontmatter: name, description
 * - XML 블록 (```xml ... ```): <agent>, <persona>, <menu>, <activation>
 */

import { readFile } from 'fs/promises';
import { load as yamlLoad } from 'js-yaml';

/**
 * 에이전트 메뉴 아이템
 */
export interface MenuItem {
  cmd?: string;
  label: string;
  workflow?: string;
  exec?: string;
  tmpl?: string;
  data?: string;
  action?: string;
  validate_workflow?: string;
  [key: string]: string | undefined;
}

/**
 * 에이전트 페르소나
 */
export interface Persona {
  role?: string;
  identity?: string;
  communication_style?: string;
  principles?: string;
}

/**
 * 에이전트 정보
 */
export interface AgentInfo {
  name: string;
  description?: string;
  filePath: string;
  agent: {
    id: string;
    name: string;
    title: string;
    icon?: string;
  };
  persona?: Persona;
  menu: MenuItem[];
  activation?: string;
}

/**
 * YAML frontmatter 추출
 *
 * @param content - 마크다운 파일 내용
 * @returns YAML 데이터와 나머지 내용
 */
function extractFrontmatter(content: string): {
  frontmatter: Record<string, unknown> | null;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  const [, yamlContent, body] = match;
  const frontmatter = yamlLoad(yamlContent) as Record<string, unknown>;
  return { frontmatter, body };
}

/**
 * XML 블록 추출 (```xml ... ``` 사이)
 *
 * @param content - 마크다운 내용
 * @returns XML 내용
 */
function extractXmlBlock(content: string): string | null {
  const match = content.match(/```xml\n([\s\S]*?)\n```/);
  return match ? match[1] : null;
}

/**
 * XML 태그 추출 (간단한 정규식 기반)
 *
 * @param xml - XML 내용
 * @param tagName - 태그 이름
 * @returns 태그 내용
 */
function extractXmlTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * XML 태그의 속성들 추출
 *
 * @param xml - XML 내용
 * @param tagName - 태그 이름
 * @returns 속성 객체
 */
function extractXmlAttributes(xml: string, tagName: string): Record<string, string> {
  const regex = new RegExp(`<${tagName}([^>]*)>`, 'i');
  const match = xml.match(regex);
  if (!match) return {};

  const attrString = match[1];
  const attrs: Record<string, string> = {};

  // 속성 파싱: key="value" 또는 key='value'
  const attrRegex = /(\w+)=["']([^"']*)["']/g;
  let attrMatch;
  while ((attrMatch = attrRegex.exec(attrString)) !== null) {
    attrs[attrMatch[1]] = attrMatch[2];
  }

  return attrs;
}

/**
 * <persona> 섹션 파싱
 *
 * @param personaXml - persona XML 내용
 * @returns Persona 객체
 */
function parsePersona(personaXml: string): Persona {
  const persona: Persona = {};

  // <role>...</role> 추출
  const role = extractXmlTag(personaXml, 'role');
  if (role) persona.role = role;

  // <identity>...</identity> 추출
  const identity = extractXmlTag(personaXml, 'identity');
  if (identity) persona.identity = identity;

  // <communication_style>...</communication_style> 추출
  const commStyle = extractXmlTag(personaXml, 'communication_style');
  if (commStyle) persona.communication_style = commStyle;

  // <principles>...</principles> 추출
  const principles = extractXmlTag(personaXml, 'principles');
  if (principles) persona.principles = principles;

  return persona;
}

/**
 * <menu> 섹션 파싱
 *
 * @param menuXml - menu XML 내용
 * @returns MenuItem 배열
 */
function parseMenu(menuXml: string): MenuItem[] {
  const items: MenuItem[] = [];

  // <item ...>...</item> 모두 추출
  const itemRegex = /<item([^>]*)>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(menuXml)) !== null) {
    const attrString = match[1];
    const label = match[2].trim();

    const item: MenuItem = { label };

    // 속성 파싱
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      const key = attrMatch[1];
      const value = attrMatch[2];
      // 동적 속성 할당
      item[key] = value;
    }

    items.push(item);
  }

  return items;
}

/**
 * 에이전트 .md 파일을 파싱합니다.
 *
 * @param filePath - 에이전트 파일 절대 경로
 * @returns 파싱된 에이전트 정보
 */
export async function parseAgentFile(filePath: string): Promise<AgentInfo> {
  const content = await readFile(filePath, 'utf-8');

  // 1. YAML frontmatter 추출
  const { frontmatter, body } = extractFrontmatter(content);

  const name = (frontmatter?.name as string) || 'unknown';
  const description = frontmatter?.description as string | undefined;

  // 2. XML 블록 추출
  const xmlBlock = extractXmlBlock(body);
  if (!xmlBlock) {
    throw new Error(`No XML block found in agent file: ${filePath}`);
  }

  // 3. <agent> 태그 속성 추출
  const agentAttrs = extractXmlAttributes(xmlBlock, 'agent');
  if (!agentAttrs.id || !agentAttrs.name || !agentAttrs.title) {
    throw new Error(`Invalid <agent> tag in ${filePath}: id, name, title are required`);
  }

  // 4. <persona> 섹션 파싱
  const personaXml = extractXmlTag(xmlBlock, 'persona');
  const persona = personaXml ? parsePersona(personaXml) : undefined;

  // 5. <menu> 섹션 파싱
  const menuXml = extractXmlTag(xmlBlock, 'menu');
  const menu = menuXml ? parseMenu(menuXml) : [];

  // 6. <activation> 섹션 추출 (전체)
  const activation = extractXmlTag(xmlBlock, 'activation');

  return {
    name,
    description,
    filePath,
    agent: {
      id: agentAttrs.id,
      name: agentAttrs.name,
      title: agentAttrs.title,
      icon: agentAttrs.icon,
    },
    persona,
    menu,
    activation: activation || undefined,
  };
}
