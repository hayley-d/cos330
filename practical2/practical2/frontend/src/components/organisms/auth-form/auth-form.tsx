import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    Input,
    Button
} from "@/components/primitives";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const registerSchema = loginSchema.extend({
    name: z.string().min(2, { message: "Name is required" }),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

interface AuthFormProps {
    mode: "login" | "register";
    onSubmit: (values: LoginValues | RegisterValues) => void;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
    const schema = mode === "login" ? loginSchema : registerSchema;

    const form = useForm<LoginValues | RegisterValues>({
        resolver: zodResolver(schema),
        defaultValues:
            mode === "login"
                ? { email: "", password: "" }
                : { name: "", email: "", password: "" },
    });

    return (
        <div className="min-h-svh w-svw flex items-center justify-center bg-background text-foreground p-4">
            <div className="w-full max-w-md rounded-2xl border bg-card text-card-foreground shadow-lg p-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {mode === "register" && (
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground">Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your name" className="bg-background" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="you@example.com" className="bg-background" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground">Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="********" className="bg-background" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full">
                            {mode === "login" ? "Log In" : "Register"}
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
