import App from '@/app';

const app = new App();

app.prepare().then(() => {
  app.listen().catch((err) => {
    console.error('Error starting server', err);
    process.exit(1);
  })
}).catch((err) => {
  console.error('Error preparing server', err);
  process.exit(1);
})
