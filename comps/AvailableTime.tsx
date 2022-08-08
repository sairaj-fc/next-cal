// import { SchedulingType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, useEffect, useState } from "react";

import dayjs, { Dayjs } from "@lib/dayjs";

import { classNames, nameOfDay } from "@lib/utils";
import { time_zone } from "@lib/utils/clock";

export type Slot = {
  time: string;
  attendees?: number;
  bookingUid?: string;
  users?: string[];
};

type AvailableTimesProps = {
  timeFormat: string;
  eventTypeId: string;
  recurringCount: number | undefined;
  eventTypeSlug: string;
  date: Dayjs;
  users: {
    username: string | null;
  }[];
  seatsPerTimeSlot?: number | null;
  slots?: Slot[];
  isLoading: boolean;
};

const AvailableTimes: FC<AvailableTimesProps> = ({
  slots = [],
  isLoading,
  date,
  eventTypeId,
  eventTypeSlug,
  recurringCount,
  timeFormat,
  seatsPerTimeSlot,
}) => {
  const router = useRouter();
  const { rescheduleUid } = router.query;

  const [brand, setBrand] = useState("#292929");

  useEffect(() => {
    setBrand(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--brand-color")
        .trim()
    );
  }, []);

  return (
    <div className="mt-8 flex flex-col text-center">
      <div className="mb-4 text-left text-lg font-light text-gray-900">
        <span className="text-gray-900 w-1/2">
          <strong>{nameOfDay("env", Number(date.format("d")))}</strong>
          <span className="text-bookinglight">
            {date.format(", D ")}
            {date.toDate().toLocaleString("env", { month: "long" })}
          </span>
        </span>
      </div>
      <div className="grid flex-grow grid-cols-2 gap-x-2 overflow-y-auto sm:block">
        {slots.length > 0 &&
          slots.map((slot) => {
            type BookingURL = {
              pathname: string;
              query: Record<string, string | number | string[] | undefined>;
            };
            const bookingUrl: BookingURL = {
              pathname: "book",
              query: {
                ...router.query,
                date: dayjs(slot.time).format(),
                type: eventTypeId,
                slug: eventTypeSlug,
                /** Treat as recurring only when a count exist and it's not a rescheduling workflow */
                count:
                  recurringCount && !rescheduleUid ? recurringCount : undefined,
              },
            };

            if (rescheduleUid) {
              bookingUrl.query.rescheduleUid = rescheduleUid as string;
            }

            // If event already has an attendee add booking id
            if (slot.bookingUid) {
              bookingUrl.query.bookingUid = slot.bookingUid;
            }

            return (
              <div key={dayjs(slot.time).format()}>
                {/* Current there is no way to disable Next.js Links */}
                {seatsPerTimeSlot &&
                slot.attendees &&
                slot.attendees >= seatsPerTimeSlot ? (
                  <div
                    className={classNames(
                      "text-primary-500 mb-2 block rounded-sm border bg-white py-4 font-medium opacity-25  ",
                      brand === "#fff" || brand === "#ffffff"
                        ? "border-brandcontrast"
                        : "border-brand"
                    )}
                  >
                    {dayjs(slot.time).tz(time_zone()).format(timeFormat)}
                    {!!seatsPerTimeSlot && (
                      <p className="text-sm">Booking Full</p>
                    )}
                  </div>
                ) : (
                  <Link href={bookingUrl} prefetch={false}>
                    <a
                      className={classNames(
                        "text-primary-500 hover:bg-gray-100 text-gray-700 mb-2 block rounded-sm border bg-white py-4 font-medium ",
                        brand === "#fff" || brand === "#ffffff"
                          ? "border-brandcontrast"
                          : "border-brand"
                      )}
                      data-testid="time"
                    >
                      {dayjs(slot.time).tz(time_zone()).format(timeFormat)}
                      {!!seatsPerTimeSlot && (
                        <p
                          className={`${
                            slot.attendees &&
                            slot.attendees / seatsPerTimeSlot >= 0.8
                              ? "text-rose-600"
                              : slot.attendees &&
                                slot.attendees / seatsPerTimeSlot >= 0.33
                              ? "text-yellow-500"
                              : "text-emerald-400"
                          } text-sm`}
                        >
                          {slot.attendees
                            ? seatsPerTimeSlot - slot.attendees
                            : seatsPerTimeSlot}{" "}
                          / {seatsPerTimeSlot} Seats Available
                        </p>
                      )}
                    </a>
                  </Link>
                )}
              </div>
            );
          })}

        {!isLoading && !slots.length && (
          <div className="-mt-4 flex h-full w-full flex-col content-center items-center justify-center">
            <h1 className="my-6 text-xl text-black ">All Booked Today</h1>
          </div>
        )}

        {isLoading && !slots.length && <>loading...</>}
      </div>
    </div>
  );
};

export default AvailableTimes;
