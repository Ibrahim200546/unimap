import AuthGate from "@/components/auth-gate";
import UniMapApp from "@/components/unimap-app";

export default function Page() {
  return (
    <AuthGate>
      <UniMapApp />
    </AuthGate>
  );
}
