// src/app/(app)/(tasks)/new.tsx
// Rota legada — redireciona para new-task que é a rota oficial (declarada no _layout.tsx)

import { Redirect } from 'expo-router';

export default function NewTaskRedirect() {
  return <Redirect href={'/(app)/(tasks)/new-task' as never} />;
}
