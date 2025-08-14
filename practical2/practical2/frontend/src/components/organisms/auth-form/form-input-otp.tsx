import { type FieldValues, useFormContext } from "react-hook-form";

import {
    FormItem,
    FormField,
    FormMessage,
    FormControl,
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/primitives";

import type { InputHTMLAttributes } from "react";
import type { FieldValue } from "react-hook-form";

export type FormInputProps<V extends FieldValues> = {
    name: FieldValue<V>;
    label?: string;
    helpText?: string;
    className?: string;
} & Partial<InputHTMLAttributes<HTMLInputElement>>;

export const FormInputOtp = <V extends FieldValues>({
                                                        name,
                                                    }: FormInputProps<V>) => {
    const { control } = useFormContext();

    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <div>
                            <InputOTP maxLength={6} {...field}>
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
