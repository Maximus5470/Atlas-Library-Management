import React from "react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import BookList from "@/components/BookList";
import { sampleBooks } from "@/constants";

const Page = () => {
  return (
    <>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
        className={`mb-10`}
      >
        <Button>Logout</Button>
      </form>
      <BookList books={sampleBooks} title={"Borrowed Books"} />
    </>
  );
};
export default Page;
