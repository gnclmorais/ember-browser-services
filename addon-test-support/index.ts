import window from 'ember-window-mock';
import Service from '@ember/service';
import { proxyService } from 'ember-browser-services/utils/proxy-service';
import { setupWindowMock } from 'ember-window-mock/test-support';

import { FakeLocalStorageService } from './-private/local-storage';

import type { TestContext } from 'ember-test-helpers';
import type { RecursivePartial } from '../addon/types';

type Fakes = {
  window?: boolean | typeof Service | RecursivePartial<Window>;
  localStorage?: boolean;
  document?: boolean | typeof Service | RecursivePartial<Document>;
  navigator?: boolean | RecursivePartial<Navigator>;
};

export function setupBrowserFakes(hooks: NestedHooks, options: Fakes): void {
  setupWindowMock(hooks);

  hooks.beforeEach(function (this: TestContext) {
    if (options.window) {
      let service = maybeMake(options.window, window);

      this.owner.register('service:browser/window', service);
    }

    if (options.document) {
      let service = maybeMake(options.document, window.document);

      this.owner.register('service:browser/document', service);
    }

    if (options.localStorage) {
      this.owner.register('service:browser/local-storage', FakeLocalStorageService);
    }

    if (options.navigator) {
      if (typeof options.navigator === 'object') {
        options.navigator = {
          mediaDevices: { ...options.navigator?.mediaDevices },
          ...options.navigator,
        };
      }

      let service = maybeMake(options.navigator, window.navigator);

      this.owner.register('service:browser/navigator', service);
    }
  });
}

// This should probably get moved into ember-window-mock?
// But ember-window-mock doesn't have a way to set up a mock / stub object
// all at once.
//
// eslint-disable-next-line @typescript-eslint/ban-types
function recursivelyProxy(root: any, partial?: any) {
  if (!partial) return root;

  let changes: UnknownObject = {};

  let handler = {
    get(target: any, key: string, receiver: unknown): unknown {
      console.log(changes);
      if (key in changes) {
        return changes[key];
      }

      if (typeof target[key] === 'object' && typeof partial[key] === 'object') {
        return recursivelyProxy(target[key], partial[key]);
      }

      if (key in partial) {
        return partial[key];
      }

      return Reflect.get(target, key, receiver);
    },
    set(_target: any, key: string, value: unknown): boolean {
      console.log(key, value);
      changes[key] = value;

      // No setting on window objects during testing
      // everything is immutable (otherwise it would cause leakages / page navigations)
      return true;
    },
  };

  return new Proxy(root, handler);
}

// this usage of any is correct, because it literally could be *any*thing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UnknownObject = Record<string, any>;

export function maybeMake<DefaultType extends UnknownObject, TestClass extends UnknownObject>(
  maybeImplementation: true | typeof Service | TestClass | RecursivePartial<DefaultType>,
  target: DefaultType,
): DefaultType {
  if (maybeImplementation === true) {
    return target;
  }

  if (maybeImplementation.prototype instanceof Service) {
    return target;
  }

  if (typeof maybeImplementation === 'object') {
    let proxiedTarget = recursivelyProxy(target, maybeImplementation);

    return proxyService(proxiedTarget);
  }

  return proxyService(target);
}
