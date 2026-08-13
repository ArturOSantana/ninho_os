import { Redirect } from 'expo-router';

// Rota raiz: redireciona para o login como ponto de entrada padrão.
// O NavigationGuard em _layout.tsx se encarrega de redirecionar
// para a rota correta assim que o estado de autenticação for resolvido.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
