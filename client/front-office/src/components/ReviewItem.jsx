import React, { useState } from "react";
import CompanyManage from "../services/CompanyManage";
import Cookies from "js-cookie";
import { Image, Box, Text, FormLabel, Input, Button, useToast } from "@chakra-ui/react";

const Review = ({ data, user }) => {
  const token = Cookies.get("token");
  const [newComment, setNewComment] = useState("");
  const toast = useToast();

  const addReview = async () => {
    if (token) {
      const ret = await CompanyManage.updateCompany(data._id, {
        review: [
          ...data.review,
          { userid: user._id, content: newComment, date: new Date() },
        ],
      });
      if (ret.status.toString() === "200") {
        toast({
          title: "Review posted successfully!",
          status: 'success',
          duration: 3500,
          variant: 'subtle',
          position: 'top-center',
        });
        window.location = window.location;
      }
      else
        toast({
          title: "Ops something went wrong!",
          description: "If you can't proceed reviewing try to re-access.",
          status: 'error',
          duration: 3500,
          variant: 'subtle',
          position: 'top-center',
        });
    } else {
      toast({
        title: "Log-in first!",
        status: 'warning',
        duration: 3500,
        variant: 'subtle',
        position: 'top-center',
      });
    }
  };

  return (
    <div className="mt-5 p-2 border rounded">
      <div>
        <FormLabel>Write a review for this company!</FormLabel>
        <Input
          type="text"
          placeholder="Write here..."
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button
          className="mt-2"
          size={"sm"}
          colorScheme={"red"}
          onClick={addReview}
        >
          Send
        </Button>
      </div>
      {/* comment section */}
      <div className="mt-2">
        {data.review?.map((item, i) => (
          <Box className="p-2 m-2" key={i}>
            <Box display="flex" flexDirection={{ base: "column", sm: "row" }}>
              <Box display={"flex"} justifyContent={"center"} flexShrink="0">
                <Image
                  borderRadius="full"
                  boxSize="75px"
                  src={item.user?.photo}
                  alt="post-img"
                />
              </Box>
              <Text
                as="p"
                marginTop="3"
                marginLeft={{ base: "0", sm: "3" }}
                fontSize={{ base: "md", sm: "lg" }}
              >
                <div className="flex flex-col">
                  <span className="text-md">{item.content}</span>
                  <span className="text-xs">
                    Posted by{" "}
                    <span className="font-bold mr-1">
                      {item.user?.name} {item.user?.surname}
                    </span>
                    on {item.date?.replace("T", " ").slice(0, -5)}
                  </span>
                </div>
              </Text>
            </Box>
          </Box>
        ))}
      </div>
    </div>
  );
};

export default Review;
