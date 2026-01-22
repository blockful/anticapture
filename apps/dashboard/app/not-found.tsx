import { Button } from "@/shared/components";
import { NotFoundPageIcon } from "@/shared/components/icons/NotFoundPageIcon";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anticapture - Page not found",
};

const NotFound = () => {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto">
        <div className="lg:hidden">
          <HeaderMobile />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="animate-fade-in relative flex w-full flex-1 items-center justify-center">
            <Image
              src="/images/bg-404.png"
              alt="Not Found"
              width={1200}
              height={302}
              className="animate-fade-in pointer-events-none absolute left-1/2 top-0 w-[1200px] min-w-[1200px] -translate-x-1/2"
            />
            <div className="text-primary relative z-10 flex w-full flex-col items-center justify-center gap-4 px-5">
              <NotFoundPageIcon className="w-full max-w-[602px]" />
              <h3 className="text-primary font-['Roboto_Mono'] text-[24px] font-normal uppercase leading-8">
                [ERROR:page_NOT_FOUND]
              </h3>
              <div className="flex flex-col items-center justify-center">
                <p className="text-secondary text-center font-['Inter'] text-base font-normal leading-6">
                  The system couldn&apos;t resolve the requested route.
                </p>
                <p className="text-secondary text-center font-['Inter'] text-base font-normal leading-6">
                  Check the URL or submit a bug report.
                </p>
              </div>

              <div className="mt-4 flex w-full flex-col items-center justify-center gap-2 lg:flex-row">
                <Button
                  asChild
                  variant="primary"
                  className="w-full lg:w-auto"
                  size="md"
                >
                  <Link href="/">Go to Dashboard</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full lg:w-auto"
                  size="md"
                >
                  <Link
                    href="https://t.me/+4oj-_q_8bGI4N2Qx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Report Issue
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default NotFound;
