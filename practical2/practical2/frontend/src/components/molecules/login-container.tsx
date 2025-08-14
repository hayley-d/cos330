import type {FC, ReactNode} from "react";

export type ChildrenProps = {
    children: ReactNode;
};

export const AuthLayout: FC<ChildrenProps> = ({ children }) => (
    <div className="grid min-h-svh w-svw lg:grid-cols-2 bg-background text-foreground">

        <div className="flex items-center justify-center px-4 py-6 sm:px-8">
            <div className="w-full max-w-sm sm:max-w-md md:max-w-lg">
                {children}
            </div>
        </div>


        <div className="relative hidden lg:block">
            <img
                src="/iron-man.jpg"
                alt="auth"
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="lazy"
                decoding="async"
                aria-hidden="true"
            />

            <div className="absolute inset-0 bg-primary/20 mix-blend-multiply" aria-hidden="true" />

            <div className="absolute bottom-0 left-0 right-0 p-6 text-primary-foreground/90">

            </div>
        </div>
    </div>
);
