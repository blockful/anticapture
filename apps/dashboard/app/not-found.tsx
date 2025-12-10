import { Button } from "@/shared/components";
import { NotFoundPageIcon } from "@/shared/components/icons/NotFoundPageIcon";
import { HeaderSidebar } from "@/widgets";
import { HeaderMobile } from "@/widgets/HeaderMobile";
import { Footer } from "@/shared/components/design-system/footer/Footer";
import Image from "next/image";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="bg-surface-background dark flex h-screen overflow-hidden">
      <HeaderSidebar />
      <main className="flex-1 overflow-auto sm:ml-[72px]">
        <div className="sm:hidden">
          <HeaderMobile />
        </div>
        <div className="flex min-h-screen w-full flex-col items-center">
          <div className="relative flex w-full flex-1 items-center justify-center">
            <Image
              src="/images/bg-404.png"
              alt="Not Found"
              width={602}
              height={302}
              className="pointer-events-none absolute left-0 top-0 h-screen w-full object-cover"
            />
            <div className="text-primary relative z-10 flex flex-col items-center justify-center gap-4">
              <NotFoundPageIcon />
              <h3 className="text-primary font-['Roboto_Mono'] text-[24px] font-normal uppercase leading-8">
                [ERROR:page_NOT_FOUND]
              </h3>
              <p className="text-secondary text-center font-['Inter'] text-base font-normal leading-6">
                The system couldn&apos;t resolve the requested route. Check the
                URL or submit a bug report.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button asChild variant="primary" size="md">
                  <Link href="/">Go to Dashboard</Link>
                </Button>
                <Button asChild variant="outline" size="md">
                  <Link href="/">Report Issue</Link>
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
