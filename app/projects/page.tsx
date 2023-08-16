import React from "react";

const projects = () => {
  const array = Array.from(Array(10).keys());

  return (
    <div className="grid grid-cols-3 gap-12 mt-10">
      {array.map((item) => (
        <div key={item} className="">
          <img
            src="https://source.unsplash.com/random/1000x1000"
            alt="My Image"
          />
          <p className="text-black truncate whitespace-nowrap">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        </div>
      ))}
    </div>
  );
};

export default projects;
