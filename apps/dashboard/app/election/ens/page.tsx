import React from "react";

export default function ElectionPage() {
  return (
    <div className="min-h-screen w-full bg-dark">
      <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col text-center">
          <h1 className="text-xl font-bold text-white sm:text-5xl">
            ENS electionful
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl md:text-base">
            Manage your DAO elections with ease
          </p>
        </div>
      </div>
    </div>
  );
}
