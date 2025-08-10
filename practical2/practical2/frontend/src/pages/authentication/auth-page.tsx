import { AuthForm } from "@/components/organisms"

import {Tabs, TabsList, TabsContent, TabsTrigger} from "@/components/primitives";
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
                <Tabs defaultValue="login">
                    <TabsList>
                        <TabsTrigger value="login">Login</TabsTrigger>
                        <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>
                    <TabsContent value="login">
                        <AuthForm mode="login" onSubmit={(v) => console.log("login", v)} />
                    </TabsContent>
                    <TabsContent value="register">
                        <AuthForm mode="register" onSubmit={(v) => console.log("register", v)} />
                    </TabsContent>
                </Tabs>

            </AuthLayout>
        );
}
