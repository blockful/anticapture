"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import type * as z from "zod";

import { REQUEST_FEATURE_PRIORITIES } from "@/features/request-feature/constants";
import {
  requestFeatureFormSchema,
  useRequestFeatureForm,
} from "@/features/request-feature/hooks/useRequestFeatureForm";
import { showToast } from "@/features/request-feature/utils/showToast";
import { Button, TheSectionLayout } from "@/shared/components";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
} from "@/shared/components/design-system/form";
import {
  FormLabel,
  Input,
  Select,
  Textarea,
} from "@/shared/components/design-system/form/fields";
import daoConfigByDaoId from "@/shared/dao-config";
import type { DaoIdEnum } from "@/shared/types/daos";

type RequestFeatureFormValues = z.infer<typeof requestFeatureFormSchema>;

export const RequestFeatureSection = () => {
  const daoIdParam = useParams().daoId as string;
  const daoId = daoIdParam.toUpperCase() as DaoIdEnum;
  const daoConfig = daoConfigByDaoId[daoId];
  const { mutate: sendRequest, isPending } = useRequestFeatureForm();

  const form = useForm<RequestFeatureFormValues>({
    resolver: zodResolver(requestFeatureFormSchema),
    defaultValues: {
      email: "",
      featureRequest: "",
      otherThoughts: "",
    },
  });

  const onSubmit = (data: RequestFeatureFormValues) => {
    sendRequest(
      { ...data, daoId },
      {
        onSuccess: () => {
          showToast(
            "Request sent successfully! Thank you for helping us improve.",
            "success",
          );
          form.reset();
        },
        onError: (error) => {
          console.error("Error submitting feature request:", error);
          showToast("Failed to send request. Please try again.", "error");
        },
      },
    );
  };

  return (
    <TheSectionLayout
      title="Request a Feature"
      icon={<Sparkles className="section-layout-icon" />}
      description={`We're committed to building the best possible experience through the ${daoConfig.name} Governance Dashboard. The best ideas come from the community, so share your suggestions for new features, metrics, and improvements you'd like to see.`}
    >
      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <div className="bg-surface-default hidden flex-col space-y-6 p-5 lg:flex">
          <div>
            <h2 className="text-primary mb-4 flex font-mono text-lg font-medium">
              WHY_REQUEST_FEATURES <span className="text-link">_</span>
            </h2>
            <ul className="text-secondary space-y-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-highlight">›</span>
                <span>Suggest new metrics, charts, or data views</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-highlight">›</span>
                <span>Improve existing pages and workflows</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-highlight">›</span>
                <span>Shape the future of this dashboard</span>
              </li>
            </ul>
          </div>
          <div className="border-border-default border-t border-dashed" />
          <div>
            <h2 className="text-primary mb-4 flex font-mono text-lg font-medium">
              WHAT_HAPPENS_NEXT <span className="text-link">_</span>
            </h2>
            <p className="text-secondary text-sm">
              Every request goes straight to the team building this dashboard.
              We review each idea and may follow up by e-mail if we need more
              details.
            </p>
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
            FEATURE_REQUEST <span className="text-link">_</span>
          </h2>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 lg:space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Your e-mail<span className="text-error">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featureRequest"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      What would you like to see built?
                      <span className="text-error">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-32 resize-none"
                        placeholder='e.g. "A leaderboard showing the most active delegates by voting participation over the last 90 days"'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-secondary">
                      The more detail you share, the better we can bring your
                      idea to life.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>
                      How much is this blocking you today?
                      <span className="text-error">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        items={[...REQUEST_FEATURE_PRIORITIES]}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select priority"
                        error={!!fieldState.error}
                        aria-label="How much is this blocking you today?"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="otherThoughts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel isOptional>Any other thoughts?</FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-24 resize-none"
                        placeholder="What's working well, what's frustrating, or anything else on your mind about the dashboard"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                loading={isPending}
                data-ph-event="feature_request_submitted"
                data-ph-source="request_feature_form"
                data-umami-event="feature_request_submitted"
              >
                Submit request <Sparkles size={16} />
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </TheSectionLayout>
  );
};
