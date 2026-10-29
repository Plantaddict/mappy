import Nav from "@/components/Nav";
import AuthForm from "@/components/AuthForm";

export default function SignupPage() {
  return (
    <>
      <Nav />
      <main className="px-4"><AuthForm mode="signup" /></main>
    </>
  );
}
