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
    <div className="max-w-5xl mx-auto pt-48 md:pt-60 pb-16 px-5 md:px-10">
      <div className="text-md md:text-lg text-black dark:text-white break-word [&>p]:mt-5">
        {page?.content && (
          <PortableText
            value={page.content}
            components={PortableTextComponent}
          />
        )}
      </div>
    </div>
  );
}

export default Page;
