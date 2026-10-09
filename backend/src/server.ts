import { app } from './app';

const porta = Number(process.env.PORT) || 3000;

app.listen(porta, () => {
  console.log(`PedeJá backend rodando em http://localhost:${porta}`);
});
