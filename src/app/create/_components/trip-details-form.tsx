"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { format } from "date-fns";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formSchema } from "~/lib/types";
import { TRPCClientError } from "@trpc/client";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Calendar } from "~/components/ui/calendar";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

const travelStyles = [
  "Relaxed & Easy",
  "Active & Adventurous",
  "Cultural & Historical",
  "Family-oriented",
  "Fast-paced",
  "Packed with Activities",
];

export function TripDetailsForm() {
  const router = useRouter();
  const createTripFromForm = api.trips.createTripFromForm.useMutation({
    onSuccess: (data) => {
      router.push(`/trip/${data.tripId}`);
    },
    onError: (error) => {
      if (error instanceof TRPCClientError) {
        toast.error(error.message);
      } else {
        toast.error("An unknown error occurred");
      }
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tripName: "",
      startLocation: "",
      destination: "",
      numTravelers: "1",
      travelStyle: "",
      preferredActivities: "",
      specialRequirements: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    toast.promise(createTripFromForm.mutateAsync(values), {
      loading: "Creating trip...",
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        className="mb-5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        onClick={() => router.push("/create")}
      >
        <ArrowLeft className="size-4" />
        Back
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="tripName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trip Name</FormLabel>
                <FormControl>
                  <Input
                    className="!text-sm"
                    placeholder="Summer Vacation 2025"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "bg-transparent pl-3 text-left font-normal hover:bg-transparent",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "bg-transparent pl-3 text-left font-normal hover:bg-transparent",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const startDate = form.getValues("startDate");
                          return startDate
                            ? date <
                                new Date(
                                  startDate.getTime() + 24 * 60 * 60 * 1000,
                                )
                            : date < new Date();
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="startLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Location</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="!text-sm"
                      placeholder="New York City"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destination"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination(s)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="!text-sm"
                      placeholder="London, Edinburgh, Paris"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <FormField
              control={form.control}
              name="travelStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Travel Style</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your travel style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {travelStyles.map((style) => (
                        <SelectItem key={style} value={style}>
                          {style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numTravelers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Travelers</FormLabel>
                  <FormControl>
                    <Input
                      className="!text-sm"
                      type="number"
                      min="1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="preferredActivities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Activities</FormLabel>
                <FormControl>
                  <Textarea
                    className="resize-none !text-sm"
                    rows={3}
                    placeholder="E.g., sightseeing, hiking, food tours, museums..."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional: List activities, attractions, or experiences
                  you&apos;re interested in.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="specialRequirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requirements</FormLabel>
                <FormControl>
                  <Textarea
                    className="resize-none !text-sm"
                    rows={3}
                    placeholder="Anything else you would like the AI to know about your trip?"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Optional: Add any dietary restrictions, accessibility needs,
                  or other special requirements.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-pink-500 font-semibold text-white hover:bg-pink-600"
          >
            Create Trip
          </Button>
        </form>
      </Form>
    </>
  );
}
