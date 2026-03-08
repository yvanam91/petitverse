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

interface WelcomeEmailProps {
    firstName?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const WelcomeEmail = ({ firstName = "Aventurier" }: WelcomeEmailProps) => (
    <Html>
        <Head />
        <Preview>Bienvenue dans l'univers Picoverse 🚀</Preview>
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
                        Salut <strong>{firstName}</strong>,
                    </Heading>
                    <Text className="text-black text-[14px] leading-[24px]">
                        Merci de soutenir Picoverse dans son lancement. Tu participes directement au succès d'une plateforme libre et indépendante. <br />Clique sur le lien ci-dessous pour finaliser ton inscription :
                    </Text>
                    <Section className="text-center mt-[32px] mb-[32px]">
                        <Button
                            className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                            href={`${baseUrl}/dashboard`}
                        >
                            Commencer l'aventure
                        </Button>
                    </Section>
                    <Text className="text-black text-[14px] leading-[24px]">
                        Ou copie et colle ce lien dans ton navigateur :{" "}
                        <a href={`${baseUrl}/dashboard`} className="text-blue-600 no-underline">
                            {baseUrl}/dashboard
                        </a>
                    </Text>
                    <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
                    <Text className="text-[#666666] text-[12px] leading-[24px]">
                        Si tu n'as pas créé ce compte, tu peux ignorer cet e-mail en toute sécurité.
                        Picoverse Inc. • Rouen, Normandie 🇫🇷
                    </Text>
                </Container>
            </Body>
        </Tailwind>
    </Html>
);

export default WelcomeEmail;