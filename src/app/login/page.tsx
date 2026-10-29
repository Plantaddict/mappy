import Nav from "@/components/Nav";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="px-4"><AuthForm mode="login" /></main>
    </>
  );
}
