import { createCoreService, type Config } from '@workspace/core';
import { formatDate, capitalize } from '@workspace/utils';
import { Button } from '@workspace/ui';

/**
 * Main web application
 */

const config: Config = {
  name: 'workspace-web-app',
  version: '1.0.0',
  environment: 'development',
};

const coreService = createCoreService(config);
coreService.initialize();

console.log('App initialized at:', formatDate(new Date()));
console.log('Welcome to', capitalize('workspace'));

const button = new Button({
  label: 'Click me',
  variant: 'primary',
  onClick: () => console.log('Button clicked!'),
});

document.body.appendChild(button.render());
