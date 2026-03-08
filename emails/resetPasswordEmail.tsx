import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface ResetPasswordEmailProps {
    firstName?: string;
    resetLink?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const ResetPasswordEmail = ({
    firstName = "Aventurier",
    resetLink = `${baseUrl}/auth/reset-password`
}: ResetPasswordEmailProps) => (
    <Html>
        <Head />
        <Preview>Réinitialisation de ton mot de passe Picoverse 🔒</Preview>
        <Tailwind>
            <Body className="bg-white my-auto mx-auto font-sans">
                <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
                    <Section className="mt-[32px]">
                        <Img
                            src={`https://qchiljvhlaltvhxncmlx.supabase.co/storage/v1/object/public/assets/mono_gradient_light.svg`}
                            width="60"
                            alt="Picoverse"
                            className="mx-auto block"
                        />
                        <Heading className="text-black text-[24px] font-bold text-center p-0 my-[30px] mx-0 uppercase tracking-tighter">
                            PICOVERSE
                        </Heading>
                    </Section>

                    <Heading className="text-black text-[20px] font-normal text-center p-0 my-[30px] mx-0">
                        Modification du mot de passe
                    </Heading>

                    <Text className="text-black text-[14px] leading-[24px]">
                        Salut <strong>{firstName}</strong>,<br /><br />
                        Nous avons reçu une demande de réinitialisation du mot de passe pour ton compte Picoverse. Si tu n'es pas à l'origine de cette demande, tu peux ignorer cet email, ton mot de passe d'origine restera inchangé.
                    </Text>

                    <Section className="text-center mt-[32px] mb-[32px]">
                        <Button
                            className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                            href={resetLink}
                        >
                            Changer mon mot de passe
                        </Button>
                    </Section>

                    <Text className="text-black text-[14px] leading-[24px]">
                        Ce lien est valable pendant **60 minutes**.
                    </Text>

                    <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                    <Text className="text-[#666666] text-[12px] leading-[24px]">
                        Besoin d'aide ? Réponds simplement à cet e-mail.<br />
                        Picoverse Inc. • Rouen, Normandie 🇫🇷
                    </Text>
                </Container>
            </Body>
        </Tailwind>
    </Html>
);

export default ResetPasswordEmail;