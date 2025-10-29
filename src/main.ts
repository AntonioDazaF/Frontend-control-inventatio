import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { MaterialModule } from './app/shared/components/material.module';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
