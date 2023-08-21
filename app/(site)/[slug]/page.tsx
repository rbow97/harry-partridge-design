import { getPage } from "@/sanity/sanity-utils";
import { PortableText } from "@portabletext/react";
import React from "react";

type Props = {
  params: { slug: string };
};

const Page = async ({ params }: Props) => {
  const page = await getPage(params.slug);

  return (
    <div className="max-w-5xl mx-auto py-20 px-10">
      <h1 className="text-5xl font-extrabold">{page.title}</h1>
      <div className="text-lg text-white mt-10">
        <PortableText value={page.content} />
      </div>
    </div>
  );
};

export default Page;
