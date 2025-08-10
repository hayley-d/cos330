import { AuthForm } from "@/components/organisms"
import {AuthLayout} from "@/components/molecules";

export function AuthPage() {
    function handleLogin(data: any) {
        console.log("Login data", data);
        // Call API here
    }

    function handleRegister(data: any) {
        console.log("Register data", data);
        // Call API here
    }

        return (
            <AuthLayout>
                <AuthForm mode="register" onSubmit={(v) => console.log("register", v)} />
            </AuthLayout>
        );
}
