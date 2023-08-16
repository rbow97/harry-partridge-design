import React from "react";

const ProjectDetail = ({ params }: { params: { slug: string } }) => {
  console.log(params.slug);
  return <p className="mt-10">PROJECT: {params.slug}</p>;
};

export default ProjectDetail;
