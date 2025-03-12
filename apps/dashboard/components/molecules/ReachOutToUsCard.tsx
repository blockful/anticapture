import { ArrowRightIcon } from "lucide-react";
import { SimpleGlobeIcon } from "../atoms/icons/SimpleGlobeIcon";
import { Card } from "../ui/card";

export const ReachOutToUsCard = ({}: {}) => {
  return (
    <Card
      className="flex w-full flex-row rounded-lg border border-lightDark bg-dark px-4 py-5 shadow hover:cursor-pointer hover:bg-lightDark sm:w-[calc(50%-10px)] xl4k:max-w-full"
      onClick={() => {
        window.open("https://tally.so/r/nrvGbv", "_blank");
      }}
    >
      <div className="flex w-full flex-row justify-between">
        <div className="flex flex-row items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-lightDark">
              <div className="h-4 w-4">
                <SimpleGlobeIcon className="text-foreground" />
              </div>
            </div>
            <h3 className="text-md font-small pl-1 text-white">
              Don&apos;t see your DAO here?
            </h3>
            <div className="flex gap-1 items-center">
              <h3 className="text-md font-small text-[#EC762E]">
                Reach out to us
              </h3>
              <div className="h-4 w-4 pl-0">
                <ArrowRightIcon className="h-full w-full text-[#EC762E]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
