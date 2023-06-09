import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Review from "../components/ReviewItem";
import PrenotationManage from "../services/PrenotationManage";
import CompanyManage from "../services/CompanyManage";
import UserManage from "../services/UserManage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Cookies from "js-cookie";
import Select from "react-select";
import {
  Checkbox,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Divider,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Button,
} from "@chakra-ui/react";

const SpecialistPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [startDate, setStartDate] = useState();
  const [startTime, setStartTime] = useState();
  const [companyPrenotation, setCompanyPrenotation] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [company, setCompany] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [cities, setCities] = useState([]);
  const [rcities, setRCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState();
  const [textArea, setTextArea] = useState();
  const [user, setUser] = useState([]);
  const token = Cookies.get("token");
  const toast = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        if (token) {
          const ret = await UserManage.getUser();
          setUser(ret.data);
        }
      } catch {
        setUser(null);
      }

      CompanyManage.getCompany(params.id).then(async (res) => {
        res.data.review = await Promise.all(
          res.data.review.map(async (item) => {
            if (item.user) {
              const { data: userReviewData } = await UserManage.getUsers({
                _id: item.user,
              });

              return {
                user: userReviewData[0],
                content: item.content,
                date: item.date,
              };
            } else {
              return {};
            }
          })
        );

        setCompany(res.data);
      });

      PrenotationManage.getPrenotations({ company: params.id }).then((res) => {
        setCompanyPrenotation(res.data);
      });
    }
    fetchData();
    calcSlot(getDateString(new Date()));
  }, []);

  useEffect(() => {
    //serve per i filtri
    if (company?.cities) {
      var arr = {};
      Object.keys(company.cities).forEach((key) => {
        if (!arr[company.cities[key]]) arr[company.cities[key]] = [];
        arr[company.cities[key]].push(key);
      });
      setCities(arr);

      var arr2 = [];
      Object.keys(arr).forEach((v) => {
        arr2.push({ value: v, label: v });
      });
      setRCities(arr2);
    }
  }, [company]);

  function chooseTime(e) {
    let time = e.value;
    let len = time.length;
    let moment = time[len - 2] + time[len - 1];
    let hours = "";

    hours += time[0] + (len > 3 ? time[1] : "");
    time = moment === "pm" && hours !== "12" ? +hours + 12 : +hours;
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
    console.log("text: " + textArea);
    var res;
    if (isOnline) {
      res = await PrenotationManage.newPrenotation({
        place: "online",
        company: companyId,
        start: start,
        duration: 1,
        text: textArea,
      });
    } else {
      res = await PrenotationManage.newPrenotation({
        place: selectedCity,
        company: companyId,
        start: start,
        duration: 1,
        text: textArea,
      });
    }
    if (res.status.toString() === "200") {
      toast({
        title: "Appointment booked successfully!",
        status: "success",
        duration: 3000,
        variant: "subtle",
      });
      window.location.reload();
    } else
      toast({
        title: "Ops something went wrong!",
        description: "If you can't proceed booking try to re-access.",
        status: "error",
        duration: 3000,
        variant: "subtle",
      });
  };

  function calcSlot(slotDay) {
    let start = company.business_hours?.start;
    let end = company.business_hours?.end;
    let interval = end - start;
    if (interval <= 0)
      toast({
        title: "Error", // qual è l'errore ?????????
        description: "It's not possible to book an appointment!",
        status: "error",
        duration: 3000,
        variant: "subtle",
      });
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
        let start_app, end_app;

        if (start + i === 12) start_app = "12pm";
        else {
          if (start + i === 0) start_app = "12am";
          else
            start_app =
              start + i > 12 ? ((start + i) % 12) + "pm" : start + i + "am";
        }

        if (start + i + 1 === 12) end_app = "12pm";
        else {
          if (start + i + 1 === 0) end_app = "12am";
          else
            end_app =
              start + i + 1 > 12
                ? ((start + i + 1) % 12) + "pm"
                : start + i + 1 + "am";
        }

        let moment = start_app + " - " + end_app;
        slots.push({ value: start_app, label: moment });
      }
    }
    setAvailableSlots(slots);
  }

  const setFilter = (date) => {
    if (date === 1 && selectedCity === company.cities?.monday) return true;
    if (date === 2 && selectedCity === company.cities?.tuesday) return true;
    if (date === 3 && selectedCity === company.cities?.wednesday) return true;
    if (date === 4 && selectedCity === company.cities?.thursday) return true;
    if (date === 5 && selectedCity === company.cities?.friday) return true;
    return false;
  };

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
        <h1
          id="specialistName"
          className="my-4 md:mt-6 md:mb-5 self-center text-center text-3xl font-semibold sm:text-5xl md:text-6xl uppercase"
        >
          {company.name}
        </h1>
        <div className="md:text-center sm:text-lg">
          <div id="companyPhoto" className="flex justify-center shrink-0 pb-5">
            <img
              src={
                company.photo === "" || company.photo === undefined
                  ? "/f/company.png"
                  : company.photo
              }
              alt={company.name + " company logo"}
              className="max-w-full h-auto rounded-full"
              resizemode="cover"
              style={{ aspectRatio: 1, height: "10rem", width: "10rem" }}
            ></img>
          </div>

          <div id="presentation">
            {company.owner !== undefined ? (
              <span className="py-1">
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
                <div className="py-1">
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
              company.study_info?.length !== 0 ? (
                <div className="py-1">
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
                <div className="py-1">
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
                <div className="py-1">
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

            {
              <div className="py-1">
                {Object.keys(cities).length === 1 ? (
                  <span>At the moment, {company.owner} only work in </span>
                ) : (
                  <span>Actual cities where {company.owner} work are </span>
                )}
                {Object.keys(cities).map((value, i) => {
                  return (
                    <span key={i}>
                      <span className="font-bold"> {value}</span>
                      {Object.keys(cities).length !== i + 1 ? ", " : "."}
                    </span>
                  );
                })}
              </div>
            }

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
            {company.online !== undefined && (
              <div>
                Takes appointment <span className="font-bold">online</span>{" "}
                also, but only if you are a vip user!
              </div>
            )}

            <div className="hidden sm:flex mt-6 mb-0 flex justify-center grow-0">
              <TableContainer className="border rounded">
                <Table variant="simple" className="">
                  <Thead>
                    <Tr>
                      <Th>Monday</Th>
                      <Th>Tuesday</Th>
                      <Th>Wednesday</Th>
                      <Th>Thursday</Th>
                      <Th>Friday</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>{company.cities?.monday}</Td>
                      <Td>{company.cities?.tuesday}</Td>
                      <Td>{company.cities?.wednesday}</Td>
                      <Td>{company.cities?.thursday}</Td>
                      <Td>{company.cities?.friday}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </div>
            <div className="flex sm:hidden mt-6 mb-0 flex flex-col justify-center mx-2 ">
              <TableContainer className="border rounded">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr className="">
                      <Th>Monday</Th>
                      <Th>Tuesday</Th>
                      <Th>Wednesday</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr className="">
                      <Td>{company.cities?.monday}</Td>
                      <Td>{company.cities?.tuesday}</Td>
                      <Td>{company.cities?.wednesday}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
              <TableContainer className="border rounded mt-2 mx-12">
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Thursday</Th>
                      <Th marginRight={"1rem"}>Friday</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>{company.cities?.thursday}</Td>
                      <Td>{company.cities?.friday}</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </TableContainer>
            </div>
          </div>
        </div>

        {token ? (
          <div className="flex flex-1 justify-center py-6 md:pt-10">
            <button onClick={onOpen} className="btn btn-secondary mt-2 mb-4">
              Book an appointment
            </button>
          </div>
        ) : (
          <div className="flex flex-1 justify-center py-6 md:pt-10">
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

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Book an appointment!</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={2}>
              <form className="relative p-6 flex-auto">
                <div className="mt-1 mb-2">
                  <span for="problemTextarea" className="font-semibold">
                    Describe here the animal and it's problem:
                  </span>
                  <Textarea
                    id="problemTextarea"
                    placeholder="My cat Toby has a ..."
                    onChange={(e) => setTextArea(e.target.value)}
                  />
                </div>

                {user?.vip && company?.online ? (
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

                {!isOnline && (
                  <div className="mb-2">
                    <span className="font-semibold" for="place">
                      Place:
                    </span>
                    <Select
                      id="place"
                      options={rcities}
                      onChange={(e) => setSelectedCity(e.value)}
                    />
                  </div>
                )}

                {/*<BookVetVisit style={{ display: "flex", height: "100%" }} />*/}
                <div className="font-semibold" for="date">
                  Date
                </div>
                <div id="date">
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
                      if (!isOnline)
                        return (
                          setFilter(date.getDay()) &&
                          date.getDay() !== 0 &&
                          date.getDay() !== 6
                        );
                      else return date.getDay() !== 0 && date.getDay() !== 6;
                    }}
                  />
                </div>
                <div className="my-1">
                  <span for="slotSelect" className="font-semibold">
                    Schedule
                  </span>
                  <div id="slotSelect">
                    <Select options={availableSlots} onChange={chooseTime} />
                  </div>
                </div>
                <div className="font-semibold my-1">
                  Duration <span className="font-normal">1 hour</span>
                </div>
                <div className="font-semibold my-1">
                  Total price{" "}
                  <span className="font-normal">€{company.cost_per_hour}</span>
                </div>
              </form>
            </ModalBody>

            <ModalFooter>
              <Button
                className="mr-2"
                colorScheme={"blue"}
                onClick={() => {
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
                    onClose();
                  } else
                    toast({
                      title: "You must book your appointment!",
                      status: "warning",
                      duration: 3000,
                      variant: "subtle",
                    });
                }}
              >
                Confirm
              </Button>
              <Button
                colorScheme={"red"}
                type="button"
                onClick={() => {
                  onClose();
                  setIsOnline(false);
                  setStartDate();
                  setSelectedCity();
                  setStartTime();
                  setTextArea();
                }}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <div className="flex justify-center my-1 md:my-4">
          <Divider
            orientation="horizontal"
            width="80%"
            justify="center"
            border="0.2rem"
            borderColor="gray.300"
          />
        </div>
        <div className="flex justify-center">
          <Review company={company} setCompany={setCompany} user={user} />
        </div>
      </div>
      <div className="flex flex-1" style={{ height: "auto" }}>
        <Footer />
      </div>
    </div>
  );
};

export default SpecialistPage;
