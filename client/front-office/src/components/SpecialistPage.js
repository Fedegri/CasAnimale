import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";
import PrenotationManage from "../services/PrenotationManage";
import CompanyManage from "../services/CompanyManage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cookies from "js-cookie";
import Select from "react-select";
import vetclinic from "../assets/vet-clinic.png";
import { Checkbox } from "@chakra-ui/react";

const SpecialistPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState();
  const [startTime, setStartTime] = useState();
  const [companyPrenotation, setCompanyPrenotation] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [company, setCompany] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const token = Cookies.get("token");

  useEffect(() => {
    async function fetchData() {
      await CompanyManage.getCompany(params.id).then((res) => {
        if (res.data.photo === undefined) res.data.photo = vetclinic;
        setCompany(res.data);
      });

      await PrenotationManage.getPrenotations({ company: params.id }).then(
        (res) => {
          setCompanyPrenotation(res.data);
        }
      );
    }
    fetchData();
    calcSlot(getDateString(new Date()));
  }, []);

  function chooseTime(e) {
    let time = e.value;
    let len = time.length;
    let moment = time[len - 2] + time[len - 1];
    let hours = "";

    hours += time[0] + (len > 3 ? time[1] : "");
    time = moment === "pm" ? +hours + 12 : +hours;
    time += ":00";
    setStartTime(time);
  }

  const newDate = (s) => {
    return new Date(s);
  };

  const getDateTimeString = (s) => {
    var d = newDate(s);
    return (
      d.getFullYear().toString() +
      "/" +
      ((d.getMonth() + 1).toString().length === 2
        ? (d.getMonth() + 1).toString()
        : "0" + (d.getMonth() + 1).toString()) +
      "/" +
      (d.getDate().toString().length === 2
        ? d.getDate().toString()
        : "0" + d.getDate().toString()) +
      " " +
      (d.getHours().toString().length === 2
        ? d.getHours().toString()
        : "0" + d.getHours().toString()) +
      ":" +
      ((parseInt(d.getMinutes() / 5) * 5).toString().length === 2
        ? (parseInt(d.getMinutes() / 5) * 5).toString()
        : "0" + (parseInt(d.getMinutes() / 5) * 5).toString())
    );
  };

  //formato mese/giorno/anno
  const getDateString = (s) => {
    var d = newDate(s);
    return (
      ((d.getMonth() + 1).toString().length === 2
        ? (d.getMonth() + 1).toString()
        : "0" + (d.getMonth() + 1).toString()) +
      "/" +
      (d.getDate().toString().length === 2
        ? d.getDate().toString()
        : "0" + d.getDate().toString()) +
      "/" +
      d.getFullYear().toString()
    );
  };
  //restituisce solo l'ora dato che gli slot vanno di ora in ora
  const getHoursString = (s) => {
    var d = newDate(s);
    return d.getHours().toString();
  };

  useEffect(() => {
    const array = [];
    companyPrenotation?.forEach((item) => {
      array.push(getDateTimeString(item.start));
    });
  }, [companyPrenotation]);

  const bookSlot = async (isOnline, companyId, start) => {
    var res;
    if (isOnline) {
      res = await PrenotationManage.newPrenotation({
        place: "online",
        company: companyId,
        start: start,
        duration: 1,
      });
    } else {
      res = await PrenotationManage.newPrenotation({
        place: "",
        company: companyId,
        start: start,
        duration: 1,
      });
    }
    alert(res.data.message);
    window.location.reload();
  };

  function calcSlot(slotDay) {
    let start = company.business_hours?.start;
    let end = company.business_hours?.end;
    let interval = end - start;
    if (interval <= 0) alert("It is not possible to book an appointment");
    let slots = [];
    const booked = [];
    companyPrenotation?.forEach((item) => {
      //seleziono solo le prenotazioni fatte nella data selezionata
      if (getDateString(item.start).localeCompare(slotDay) === 0)
        booked.push(getHoursString(item.start));
    });
    let actual_time = getHoursString(new Date());

    for (let i = 0; i < interval; i++) {
      //se lo slot non è incluso lo aggiungo a availableSlots che poi userò per riempire il select
      if (!booked.includes((start + i).toString())) {
        if (slotDay.localeCompare(getDateString(new Date())) === 0) {
          if (+actual_time >= +(start + i).toString()) {
            continue;
          }
        }
        let start_app =
          start + i > 12 ? ((start + i) % 12) + "pm" : start + i + "am";
        let end_app =
          start + i + 1 > 12
            ? ((start + i + 1) % 12) + "pm"
            : start + i + 1 + "am";

        let moment = start_app + " - " + end_app;
        slots.push({ value: start_app, label: moment });
      }
    }
    setAvailableSlots(slots);
  }

  return (
    <div
      data-theme="lemonade"
      className="flex h-screen flex-1"
      style={{
        flexDirection: "column",
        justifyContent: "space-between",
        maxHeight: "100%",
      }}
    >
      <div
        className="flex flex-1"
        style={{ height: "4rem", maxHeight: "4rem" }}
      >
        <Navbar />
      </div>

      <div className="flex flex-1 flex-col m-3" style={{ height: "auto" }}>
        <div
          id="specialistName"
          className="text-3xl font-bold sm:text-5xl md:text-7xl"
        >
          {company.name}
        </div>
        <div id="companyPhoto">
          <img
            src={company.photo}
            alt="company photo"
            className="max-w-full h-auto rounded-full"
            resizemode="cover"
            style={{ aspectRatio: 1, height: "7rem", width: "7rem" }}
          ></img>
        </div>
        <div id="presentation">
          {company.owner !== undefined ? (
            <span>
              {company.type === "vet" || company.type === "psy" ? (
                <span>The experienced Doctor </span>
              ) : company.type === "groomer" ? (
                <span>The expert grommer </span>
              ) : (
                <span>The expert pet sitter </span>
              )}
              <span id="ownerName" className="font-bold">
                {company.owner}
              </span>
            </span>
          ) : (
            <div id="ownerName" className="ml-4">
              Specialist {company._id}
            </div>
          )}
          <span> will take care of your pet.</span>
          {company.main_pets !== undefined ? (
            company.main_pets.length !== 0 ? (
              <div>
                They are mainly specialized in{" "}
                <span>
                  {company.main_pets?.map((item, i) => (
                    <span key={i}>
                      <span className="font-bold">{item}</span>
                      {company.main_pets.length !== i + 1 ? ", " : "."}
                    </span>
                  ))}
                </span>
              </div>
            ) : (
              ""
            )
          ) : (
            ""
          )}

          {company.study_info !== undefined ? (
            company.study_info.length !== 0 ? (
              <div>
                Their study carrer includes{" "}
                <span>
                  {company.study_info?.map((item, i) => (
                    <span key={i}>
                      <span className="font-bold">{item}</span>
                      {company.study_info.length !== i + 1 ? ", " : "."}
                    </span>
                  ))}
                </span>
              </div>
            ) : (
              ""
            )
          ) : (
            ""
          )}

          {company.professional_experience !== undefined ? (
            company.professional_experience.length !== 0 ? (
              <div>
                {company.owner} has got many skills through their working
                experience as{" "}
                <span>
                  {company.professional_experience?.map((item, i) => (
                    <span key={i}>
                      <span className="font-bold">{item}</span>
                      {company.professional_experience.length !== i + 1
                        ? ", "
                        : "."}
                    </span>
                  ))}
                </span>
              </div>
            ) : (
              ""
            )
          ) : (
            ""
          )}

          {company.actual_jobs !== undefined ? (
            company.actual_jobs?.length !== 0 ? (
              <div>
                Moreover,{" "}
                <span>
                  {company.actual_jobs?.map((item, i) => (
                    <span key={i}>
                      <span className="font-bold">{item}</span>
                      {company.actual_jobs?.length === i + 2
                        ? " and "
                        : company.actual_jobs?.length === i + 1
                        ? " "
                        : ", "}
                    </span>
                  ))}
                  is what {company.owner} is actually practicing.
                </span>
              </div>
            ) : (
              ""
            )
          ) : (
            ""
          )}

          {company.cities !== undefined ? (
            company?.cities?.length !== 0 ? (
              <div>
                {company.cities.length === 1 ? (
                  <span>At the moment, {company.owner} only work in </span>
                ) : (
                  <span>Actual cities where {company.owner} work are </span>
                )}
                <span>
                  {company.cities?.map((item, i) => (
                    <span key={i}>
                      <span className="font-bold">{item}</span>
                      {company.cities.length !== i + 1 ? ", " : "."}
                    </span>
                  ))}
                </span>
              </div>
            ) : (
              ""
            )
          ) : (
            ""
          )}

          {company.cost_per_hour !== undefined ? (
            <div>
              <span>
                Appointment cost per hour is{" "}
                <span id="cost" className="font-bold">
                  {company.cost_per_hour}€/h
                </span>
                .
              </span>
            </div>
          ) : (
            ""
          )}
          {company.online !== undefined ? (
            <div>
              Takes appointment <span className="font-bold">online</span> also!
            </div>
          ) : (
            ""
          )}
        </div>

        {token ? (
          <div className="flex flex-1 justify-center">
            <button
              onClick={() => {
                setShowModal(true);
              }}
              className="btn btn-secondary mt-2 mb-4"
            >
              Book an appointment
            </button>
          </div>
        ) : (
          <div className="flex flex-1 justify-center">
            <button
              className="btn btn-secondary"
              onClick={() => {
                navigate("/login");
              }}
            >
              Sign in to book an appointment
            </button>
          </div>
        )}
        {showModal ? (
          <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
              <div className="relative w-full my-6 mx-auto max-w-3xl">
                {/*content*/}
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                  {/*header*/}
                  <div className="flex items-start justify-between p-5 border-b border-solid border-slate-200 rounded-t">
                    <h3 className="text-3xl font-semibold">
                      Book an appointment!
                    </h3>
                  </div>
                  {/*body*/}
                  <div className="relative p-6 flex-auto">
                    {company.online !== undefined ? (
                      <Checkbox
                        className="mb-2"
                        size="lg"
                        colorScheme="orange"
                        onChange={() => {
                          setIsOnline(!isOnline);
                        }}
                      >
                        Online
                      </Checkbox>
                    ) : (
                      ""
                    )}
                    {/*<BookVetVisit style={{ display: "flex", height: "100%" }} />*/}
                    <div className="font-bold">Data</div>
                    <div>
                      <DatePicker
                        id="slotDay"
                        className="text-center border-solid border-4 rounded-lg px-1"
                        selected={startDate}
                        placeholderText="Select a day"
                        onChange={(date) => {
                          setStartDate(date);
                          calcSlot(getDateString(date));
                        }}
                        minDate={new Date()}
                        filterDate={(date) => {
                          return date.getDay() !== 0 && date.getDay() !== 6;
                        }}
                      />
                    </div>
                    <div className="font-bold">
                      Schedule
                      <div id="slotSelect" className="font-normal">
                        <Select
                          options={availableSlots}
                          onChange={chooseTime}
                        />
                      </div>
                    </div>
                    <div className="font-bold">
                      Duration <span className="font-normal">1 hour</span>
                    </div>
                    <div className="font-bold">
                      Total price{" "}
                      <span className="font-normal">
                        €{company.cost_per_hour}
                      </span>
                    </div>
                  </div>
                  {/*footer*/}
                  <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
                    <button
                      className="btn-primary rounded-lg font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => {
                        /*console.log(
                          "start: " +
                            company.business_hours.start +
                            " end: " +
                            company.business_hours.end
                        );
                        console.log(
                          "slotDay: " + document.getElementById("slotDay").value
                        );*/
                        if (startTime) {
                          bookSlot(
                            isOnline,
                            params.id,
                            new Date(
                              document.getElementById("slotDay").value +
                                " " +
                                startTime
                            )
                          );
                          setShowModal(false);
                        } else {
                          alert("You must schedule your appointment");
                        }
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-10 fixed inset-0 z-40 bg-black"></div>
          </>
        ) : null}
      </div>
      <div className="flex flex-1" style={{ height: "auto" }}>
        <Footer />
      </div>
    </div>
  );
};

export default SpecialistPage;
