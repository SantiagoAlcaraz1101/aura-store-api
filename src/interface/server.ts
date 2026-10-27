import { createApp } from './app';
import { dependencies } from '../infrastructure/container';
import { config } from '../infrastructure/config';
dependencies().then((deps) => { createApp(deps).listen(config.PORT, '0.0.0.0', () => console.log(`Aura API escuchando en el puerto ${config.PORT}`)); }).catch(() => { console.error('No se pudo iniciar la API. Revisa las variables de entorno.'); process.exitCode = 1; });
