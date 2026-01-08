import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactFormSchema = z.object({
  nameOrAlias: z.string().min(2),
  whichDao: z.string().min(2),
  options: z
    .array(z.string())
    .min(1)
    .refine(
      (items) =>
        items.every((item) =>
          ["foundation", "delegate", "dao-member", "researcher"].includes(item),
        ),
      "Invalid option selected",
    ),
  governorAddress: z.string().optional(),
  contactInformation: z.string().min(3),
  reasonForRequest: z.string().min(3),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validatedData = contactFormSchema.parse(body);

    const optionsText = validatedData.options
      .map((opt) => {
        switch (opt) {
          case "foundation":
            return "I work at the Foundation or Labs";
          case "delegate":
            return "I am a delegate";
          case "dao-member":
            return "I am a DAO member";
          case "researcher":
            return "I am a researcher";
          default:
            return opt;
        }
      })
      .join(", ");

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: process.env.CONTACT_EMAIL || "contact@blockful.io",
      subject: `Contact Request from ${validatedData.nameOrAlias} - ${validatedData.whichDao}`,
      html: `
        <h2>New Contact Request</h2>
        <p><strong>Name or Alias:</strong> ${validatedData.nameOrAlias}</p>
        <p><strong>Which DAO:</strong> ${validatedData.whichDao}</p>
        <p><strong>Options Selected:</strong> ${optionsText}</p>
        ${
          validatedData.governorAddress
            ? `<p><strong>Governor Address:</strong> ${validatedData.governorAddress}</p>`
            : ""
        }
        <p><strong>Contact Information:</strong> ${validatedData.contactInformation}</p>
        <p><strong>Reason for Request:</strong></p>
        <p>${validatedData.reasonForRequest.replace(/\n/g, "<br>")}</p>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Email sent successfully", id: data?.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
