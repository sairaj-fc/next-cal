// import { SchedulingType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, Fragment, useEffect, useState } from "react";

import dayjs, { Dayjs } from "@lib/dayjs";

import { classNames, nameOfDay } from "@lib/utils";
import { time_zone } from "@lib/utils/clock";
import { Dialog, Transition } from "@headlessui/react";
import { Event, User } from "@prisma/client";

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
  seatsPerTimeSlot?: number | null;
  slots?: Slot[];
  isLoading: boolean;
  profile: User;
  event: Event;
};

const AvailableTimes: FC<AvailableTimesProps> = ({
  slots = [],
  isLoading,
  date,
  eventTypeId,
  eventTypeSlug,
  timeFormat,
  seatsPerTimeSlot,
  profile,
  event,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<any>(null);

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
              },
            };

            return (
              <div key={dayjs(slot.time).format()}>
                {/* Current there is no way to disable Next.js Links */}
                {seatsPerTimeSlot &&
                slot.attendees &&
                slot.attendees >= seatsPerTimeSlot ? (
                  <div
                    className={classNames(
                      "text-primary-500 mb-2 block rounded-sm border bg-white py-4 font-medium opacity-25  "
                    )}
                  >
                    {dayjs(slot.time).tz(time_zone()).format(timeFormat)}
                    {!!seatsPerTimeSlot && (
                      <p className="text-sm">Booking Full</p>
                    )}
                  </div>
                ) : (
                  <button
                    className="w-full"
                    onClick={() => {
                      setIsOpen(true);
                      setSelectedTime(slot);
                    }}
                  >
                    <div
                      className={classNames(
                        "text-primary-500 hover:bg-gray-100 text-gray-700 mb-2 block rounded-sm border bg-white py-4 font-medium w-full"
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
                    </div>
                  </button>
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
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setIsOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Payment successful
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Your payment has been successfully submitted. We’ve sent
                      you an email with all of the details of your order.
                    </p>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsOpen(false)}
                    >
                      Got it, thanks!
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default AvailableTimes;
