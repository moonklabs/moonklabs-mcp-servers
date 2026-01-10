/**
 * BMAD configResolver 단위 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  resolveVariable,
  resolveObject,
  createResolveContext,
  getBmadRoot,
  getDefaultConfigPath,
  type ResolveContext,
} from '../configResolver.js';
import { join } from 'path';

const PROJECT_ROOT = join(process.cwd(), '..');
const BMAD_ROOT = join(PROJECT_ROOT, '_bmad');

describe('BMAD configResolver', () => {
  describe('getBmadRoot', () => {
    it('기본 BMAD 루트 경로를 반환한다', () => {
      const bmadRoot = getBmadRoot(PROJECT_ROOT);
      expect(bmadRoot).toBe(BMAD_ROOT);
    });

    it('커스텀 BMAD 루트를 지원한다', () => {
      const customRoot = getBmadRoot(PROJECT_ROOT, 'custom-bmad');
      expect(customRoot).toBe(join(PROJECT_ROOT, 'custom-bmad'));
    });
  });

  describe('getDefaultConfigPath', () => {
    it('config.yaml 경로를 반환한다', () => {
      const configPath = getDefaultConfigPath(BMAD_ROOT);
      expect(configPath).toBe(join(BMAD_ROOT, 'bmm/config.yaml'));
    });
  });

  describe('resolveVariable', () => {
    const context: ResolveContext = {
      projectRoot: '/project',
      bmadRoot: '/project/_bmad',
      configPath: '/project/_bmad/bmm/config.yaml',
      workflowDir: '/project/_bmad/bmm/workflows/dev-story',
      configData: {
        output_folder: '/output',
        user_name: 'tester',
      },
    };

    it('{project-root}를 치환한다', () => {
      const result = resolveVariable('{project-root}/src', context);
      expect(result).toBe('/project/src');
    });

    it('{config_source}를 치환한다', () => {
      const result = resolveVariable('{config_source}', context);
      expect(result).toBe('/project/_bmad/bmm/config.yaml');
    });

    it('{config_source}:key를 치환한다', () => {
      const result = resolveVariable('{config_source}:output_folder', context);
      expect(result).toBe('/output');
    });

    it('{installed_path}를 치환한다', () => {
      const result = resolveVariable('{installed_path}/instructions.xml', context);
      expect(result).toBe('/project/_bmad/bmm/workflows/dev-story/instructions.xml');
    });

    it('여러 변수를 한번에 치환한다', () => {
      const result = resolveVariable(
        '{project-root}/_bmad/{config_source}:output_folder',
        context
      );
      expect(result).toBe('/project/_bmad//output');
    });

    it('재귀적으로 변수를 해석한다', () => {
      const recursiveContext: ResolveContext = {
        ...context,
        configData: {
          base: '{project-root}/base',
          derived: '{config_source}:base/derived',
        },
      };

      const result = resolveVariable('{config_source}:derived', recursiveContext);
      expect(result).toBe('/project/base/derived');
    });

    it('재귀 깊이 제한이 있다', () => {
      const infiniteContext: ResolveContext = {
        ...context,
        configData: {
          a: '{config_source}:b',
          b: '{config_source}:a', // 순환 참조
        },
      };

      expect(() => resolveVariable('{config_source}:a', infiniteContext)).toThrow(
        /depth exceeded/
      );
    });
  });

  describe('resolveObject', () => {
    const context: ResolveContext = {
      projectRoot: '/project',
      bmadRoot: '/project/_bmad',
      configData: {
        output: '/output',
      },
    };

    it('객체 내 문자열 변수를 치환한다', () => {
      const obj = {
        path: '{project-root}/src',
        output: '{config_source}:output',
        count: 42,
      };

      const resolved = resolveObject(obj, context);

      expect(resolved.path).toBe('/project/src');
      expect(resolved.output).toBe('/output');
      expect(resolved.count).toBe(42);
    });

    it('배열 내 문자열을 치환한다', () => {
      const obj = {
        paths: ['{project-root}/a', '{project-root}/b', 123],
      };

      const resolved = resolveObject(obj, context);

      expect(resolved.paths).toEqual(['/project/a', '/project/b', 123]);
    });

    it('중첩된 객체를 재귀적으로 치환한다', () => {
      const obj = {
        nested: {
          path: '{project-root}/nested',
        },
      };

      const resolved = resolveObject(obj, context);

      expect(resolved.nested).toEqual({ path: '/project/nested' });
    });
  });

  describe('createResolveContext', () => {
    it('실제 config.yaml을 로드해서 컨텍스트를 생성한다', async () => {
      const context = await createResolveContext({
        projectRoot: PROJECT_ROOT,
      });

      expect(context.projectRoot).toBe(PROJECT_ROOT);
      expect(context.bmadRoot).toBe(BMAD_ROOT);
      expect(context.configPath).toBe(join(BMAD_ROOT, 'bmm/config.yaml'));
      expect(context.configData).toBeDefined();
      expect(context.configData?.project_name).toBe('moonklabs-mcp-servers');
    });

    it('config.yaml 로드 실패 시 경고만 출력한다', async () => {
      const context = await createResolveContext({
        projectRoot: '/nonexistent',
      });

      expect(context.configData).toBeUndefined();
    });
  });
});
