"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Footer } from "@/shared/components/design-system/footer";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { HeaderSidebar } from "@/widgets";
import { Button, TheSectionLayout } from "@/shared/components";
import { PAGES_CONSTANTS } from "@/shared/constants/pages-constants";
import { Mail, Rocket } from "lucide-react";
import Image from "next/image";
import {
  contactFormSchema,
  useContactForm,
} from "@/shared/hooks/useContactForm";
import { showCustomToast } from "@/features/governance/utils/showCustomToast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/shared/components/design-system/form";
import {
  Checkbox,
  FormLabel,
  Input,
  Textarea,
} from "@/shared/components/design-system/form/fields";

type ContactFormValues = z.infer<typeof contactFormSchema>;

const optionsList = [
  { id: "foundation", label: "I work at the Foundation or Labs" },
  { id: "delegate", label: "I am a delegate" },
  { id: "dao-member", label: "I am a DAO member" },
  { id: "researcher", label: "I am a researcher" },
];

export default function ContactPage() {
  const { mutate: sendContact, isPending } = useContactForm();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      nameOrAlias: "",
      whichDao: "",
      options: [],
      governorAddress: "",
      contactInformation: "",
      reasonForRequest: "",
    },
  });

  async function onSubmit(data: ContactFormValues) {
    sendContact(data, {
      onSuccess: () => {
        showCustomToast(
          "Message sent successfully! We'll get back to you soon.",
          "success",
        );
        form.reset();
      },
      onError: (error) => {
        console.error("Error submitting form:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        showCustomToast("Failed to send message. Please try again.", "error");
      },
    });
  }

  return (
    <div className="bg-surface-background dark flex h-screen">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <div className="h-[57px] w-full lg:hidden" />
          <HeaderMobile overlayClassName="top-[57px]" />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <TheSectionLayout
            title={PAGES_CONSTANTS.contact.title}
            icon={<Mail className="section-layout-icon" />}
            description={PAGES_CONSTANTS.contact.description}
            className="border-b-0!"
          >
            <div className="border-border-default flex border-t border-dashed lg:hidden" />
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              <div className="bg-surface-default hidden flex-col space-y-6 p-5 lg:flex">
                <div>
                  <h2 className="text-primary mb-4 flex font-mono text-lg font-medium">
                    WHY_TRANSMIT_DATA <span className="text-link">_</span>
                  </h2>
                  <ul className="text-secondary space-y-4 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-highlight">›</span>
                      <span>Request governance data from a DAO</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-highlight">›</span>
                      <span>Report a vulnerability or suspicious activity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-highlight">›</span>
                      <span>Collaborate with the Anticapture mission</span>
                    </li>
                  </ul>
                </div>
                <div className="border-border-default border-t border-dashed" />
                <div>
                  <h2 className="text-primary mb-4 flex font-mono text-lg font-medium">
                    TRANSMISSION_CHANNELS <span className="text-link">_</span>
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-primary font-medium">Email</p>
                      <p className="text-secondary">contact@blockful.io</p>
                    </div>
                    <div>
                      <p className="text-primary font-medium">X</p>
                      <p className="text-secondary">@anticapture</p>
                    </div>
                  </div>
                </div>
                <div className="relative flex-1">
                  <Image
                    src="/images/satellite.png"
                    alt="Satellite"
                    width={400}
                    height={403}
                    className="animate-fade-in pointer-events-none absolute -bottom-5 -right-5 w-[300px] lg:w-[350px]"
                  />
                </div>
              </div>

              <div className="lg:bg-surface-default lg:space-y-6 lg:p-5">
                <h2 className="text-primary mb-4 flex font-mono text-lg font-medium">
                  MISSION_DATA_REQUEST <span className="text-link">_</span>
                </h2>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6 lg:space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="nameOrAlias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Name or Alias<span className="text-error">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whichDao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Which DAO?<span className="text-error">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="options"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel>
                              Select all options that apply to your case
                              <span className="text-error">*</span>
                            </FormLabel>
                          </div>
                          <div className="space-y-2">
                            {optionsList.map((item) => (
                              <FormField
                                key={item.id}
                                control={form.control}
                                name="options"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item.id}
                                      className="flex flex-row items-start gap-2"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            item.id,
                                          )}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([
                                                  ...field.value,
                                                  item.id,
                                                ])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) =>
                                                      value !== item.id,
                                                  ),
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal leading-4">
                                        {item.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="governorAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel isOptional>Governor Address</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactInformation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Contact Information
                            <span className="text-error">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription className="text-secondary">
                            Provide your contact information, or the contact
                            details of a key decision-maker in the DAO (Telegram
                            preferred).
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reasonForRequest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Reason for Request
                            <span className="text-error">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-32 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-secondary">
                            Please share any additional comments. We appreciate
                            your input and may follow up if we need more
                            details.
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isPending}
                      loading={isPending}
                    >
                      Send Transmission <Rocket size={16} />
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </TheSectionLayout>
          <Footer />
        </div>
      </main>
    </div>
  );
}
