import { module, test } from 'qunit';
import { setupBrowserFakes } from 'ember-browser-services/test-support';
import { setupTest } from 'ember-qunit';

module('Service | browser/window', function (hooks) {
  setupTest(hooks);

  module('Examples', function (hooks) {
    setupBrowserFakes(hooks, {
      window: {
        location: { href: '' },
        parent: { location: { href: '' } },
      },
    });

    // if this test were to fail, the test suite would hang and timeout, because
    // we can't run tests and change the href at the same time
    test('can reset the href without causing a browser refresh', function (assert) {
      let service = this.owner.lookup('service:browser/window');

      // verify that the initial config works
      assert.equal(service.location.href, '');
      assert.equal(service.parent.location.href, '');

      // potential real ways to redirect to the login app
      let loginPath = 'https://example.com/login';

      service.location.href = loginPath;
      service.parent.location.href = loginPath;

      // We'll redirect away from the test if the replacement methods don't work /
      // are incorrect / have spelling errors
      assert.notEqual(service.location.href, window.location.href);
      assert.notEqual(service.parent.location.href, window.parent.location.href);

      // verify that setting actually works
      assert.equal(service.location.href, loginPath);
      assert.equal(service.parent.location.href, loginPath);
    });
  });

  module('related data is properly related', function () {
    module('location', function (hooks) {
      setupBrowserFakes(hooks, {
        window: {
          parent: { location: { href: '' } },
        },
      });

      test('it works', function (assert) {
        let service = this.owner.lookup('service:browser/window');
        let loginPath = 'https://example.com/login';

        service.parent.location.href = loginPath;

        assert.equal(service.location.href, loginPath);
        assert.equal(service.location.href, service.parent.location.href);
        assert.equal(service.location, service.parent.location);
      });
    });
  });
});
