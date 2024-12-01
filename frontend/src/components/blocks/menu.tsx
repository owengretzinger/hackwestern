"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useGameState } from "@/context/game-state";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const formSchema = z.object({
  nickname: z
    .string()
    .min(3, "Nickname must be at least 3 characters")
    .max(20, "Nickname can be at most 20 characters"),
});

const Menu = () => {
  const router = useRouter();
  const { gameState, joinGame } = useGameState();

  console.log(gameState);

  useEffect(() => {
    if (gameState.hasJoined) {
      router.push("/lobby");
    }
  }, [gameState.hasJoined, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Clicked submit");
    joinGame(values.nickname);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Welcome to Symphony</CardTitle>
          <CardDescription>
            Enter your nickname to join the lobby
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nickname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your nickname" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Join Lobby
              </Button>
              {gameState.joinError && (
                <p className="text-[0.8rem] text-red-500 mt-2 font-medium">
                  {gameState.joinError}
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Menu;
