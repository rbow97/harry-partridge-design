import React from "react";
import { getImageDimensions } from "@sanity/asset-utils";
import urlBuilder from "@sanity/image-url";
import { createClient } from "next-sanity";
import clientConfig from "@/sanity/config/client-config";

type ImageProps = {
  _type: string;
  _key: string;
  alt?: string;
  asset: {
    _ref: string;
    _type: string;
  };
};

const PortableTextComponent = {
  block: {
    blockquote: ({ children }: any) => (
      <blockquote className="text-black">{children}</blockquote>
    ),
  },
  types: {
    image: ({ value }: { value: ImageProps }) => {
      const { width, height } = getImageDimensions(value);

      if (!value?.asset?._ref) {
        return null;
      }

      return (
        <img
          className="mt-5 m-auto"
          src={urlBuilder(createClient(clientConfig))
            .image(value)
            .fit("max")
            .auto("format")
            .url()}
          alt={value.alt || " "}
          loading="lazy"
          style={{
            aspectRatio: width / height,
            maxHeight: "700px",
          }}
        />
      );
    },
  },
  marks: {
    link: ({ value, children }: any) => {
      const { blank, href } = value;
      return blank ? (
        <a href={href} target="_blank" className="text-blue-500" rel="noopener">
          {children}
        </a>
      ) : (
        <a className="text-blue-500 " href={href}>
          {children}
        </a>
      );
    },
  },
};

export default PortableTextComponent;
