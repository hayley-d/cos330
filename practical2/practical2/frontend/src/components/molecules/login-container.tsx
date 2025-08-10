import type {FC, ReactNode} from "react";

export type ChildrenProps = {
    children: ReactNode;
};

export const AuthLayout: FC<ChildrenProps> = ({ children }) => (
    <div className="grid h-screen w-screen lg:grid-cols-2">
        <div className="flex items-center justify-center mx-50">{children}</div>
        <img
            src="/sloth.webp"
            alt="auth-layout"
            className="w-full h-screen bg-fit"
        />
    </div>
);
