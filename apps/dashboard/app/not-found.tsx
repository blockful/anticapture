import { Button } from "@/shared/components";
import { NotFoundPageIcon } from "@/shared/components/icons/NotFoundPageIcon";
import Image from "next/image";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="text-primary bg-surface-background flex h-screen flex-col items-center justify-center gap-4">
      <Image
        src="/images/bg-404.png"
        alt="Not Found"
        width={602}
        height={302}
        className="pointer-events-none absolute left-0 top-0 h-full w-full object-contain"
      />
      <NotFoundPageIcon />
      <h3 className="text-primary font-['Roboto_Mono'] text-[24px] font-normal uppercase leading-8">
        [ERROR:page_NOT_FOUND]
      </h3>
      <p className="text-secondary text-center font-['Inter'] text-base font-normal leading-6">
        The system couldn&apos;t resolve the requested route. Check the URL or
        submit a bug report.
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
  );
};

export default NotFound;
