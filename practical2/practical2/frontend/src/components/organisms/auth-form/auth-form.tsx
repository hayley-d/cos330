import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    Input,
    Label,
    Button,
    Card,
    CardHeader,
    CardContent, CardDescription, CardAction, CardTitle, CardFooter, FormMessage,
} from "@/components/primitives";

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
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
        <Card className="w-full">
            <CardHeader>
                <CardTitle>{mode === "login" ? "Login to your account" : "Create an account"}</CardTitle>
                <CardDescription>
                    {mode === "login"
                        ? "Enter your email below to login to your account"
                        : "Enter your details to sign up"}
                </CardDescription>

            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {mode === "register" && (
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Your name" {...field} />
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
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="m@example.com" {...field} />
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
                                    <div className="flex items-center">
                                        <FormLabel>Password</FormLabel>
                                        {mode === "login" && (
                                            <a
                                                href="#"
                                                className="ml-auto inline-block text-sm underline underline-offset-4 text-pink-500 hover:text-pink-600"
                                            >
                                                Forgot your password?
                                            </a>
                                        )}
                                    </div>
                                    <FormControl>
                                        <Input type="password" placeholder="********" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:opacity-90">
                            {mode === "login" ? "Login" : "Register"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex-col gap-2" />
        </Card>
    );
}
