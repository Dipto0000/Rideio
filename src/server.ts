import app from './app.js';
import env from './app/config/env.js';

app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});
