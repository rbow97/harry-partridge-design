import PortableTextComponent from "@/components/PortableTextComponent";
import { getPage } from "@/sanity/sanity-utils";
import { PortableText } from "@portabletext/react";
import React from "react";

type Props = {
  params: { slug: string };
};

async function Page({ params }: Props) {
  const page = await getPage(params.slug);

  return (
    <div className="max-w-5xl mx-auto py-48 md:py-60 px-5 md:px-10">
      <div className="text-md md:text-lg text-black dark:text-white">
        <PortableText value={page.content} components={PortableTextComponent} />
      </div>
    </div>
  );
}

export default Page;
