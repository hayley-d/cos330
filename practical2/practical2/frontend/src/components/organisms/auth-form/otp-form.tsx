import { Otp, OtpPageProps, otpSchema } from "@/domains";
import {
    Form,
    SubmitButton,
    AuthSubHeader,
    AuthFormContainer,
    Button,
} from "@/components/primitives";
import {
    SubmitButton,
    AuthSubHeader,
    AuthFormContainer,
    FormInputOtp,
} from "@/components/organisms";

const initialValues = {
    otp_attempt: "",
};

export const OtpForm = () => {

    const submitForm = (formData: Otp) => console.log(formData);

    const resendOtp = () => console.log("resend");

    const FormComponents = () => (
        <AuthFormContainer className="gap-10">
            <img
                src="/iron-man.jpg"
                alt="Iron Man Logo"
                className="w-full h-full"
            />
            <AuthSubHeader
                label="Enter OTP"
                paragraph="Please authenticate your account by adding in the OTP sent to the email linked to your account."
            />
            <FormInputOtp name="otp_attempt" label="OTP" type="number" />
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="link"
                    className="underline text-base-muted-foreground"
                    onClick={resendOtp}
                >
                    Resend OTP
                </Button>
            </div>
            <SubmitButton>Sign In</SubmitButton>
        </AuthFormContainer>
    );

    return (
        <Form
            initialValues={initialValues}
            onSubmitForm={submitForm}
            render={FormComponents}
            validationSchema={otpSchema}
        />
    );
};
