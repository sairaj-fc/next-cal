import type { NextPage } from "next";
import { useState } from "react";
import TimezoneSelect from "react-timezone-select";
import dayjs from "@lib/dayjs";

const Home: NextPage = () => {
  const [selectedTimezone, setSelectedTimezone] = useState(dayjs.tz.guess());
  const [usrname, setUsrname] = useState("");

  return (
    <div className="w-1/2  mx-auto">
      <div className=" mt-16 space-y-4">
        <div>
          <div className="text-base flex items-center justify-between mb-1">
            <label htmlFor="username">Username</label>
          </div>
          <input
            id="username"
            type="text"
            className="border border-gray-400 rounded-md px-2 py-1.5 w-full"
            onChange={(e) => setUsrname(e.target.value)}
          />
        </div>
        <div className="w-full">
          <div className="text-base flex items-center justify-between mb-1">
            <label htmlFor="timezone">Select Timezone</label>
            <span className="text-black">
              Current Time {dayjs().tz(selectedTimezone).format("LT")}
            </span>
          </div>
          <TimezoneSelect
            id="timezone"
            value={selectedTimezone}
            onChange={({ value }) => setSelectedTimezone(value)}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
