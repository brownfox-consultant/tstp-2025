"use client";
import Page from "./(auth)/login/page"
import { App } from 'antd';
export default function Home() {
  return (
    <App>
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
        
      <Page/>
     
    </main>
    </App>
  );
}
