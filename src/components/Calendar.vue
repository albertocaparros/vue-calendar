
  <template>
  <v-row class="fill-height">
    <v-col>
      <v-sheet height="64">
        <v-toolbar flat>
          <v-btn class="mr-4" color="primary" @click="dialog = true">
            New Event
          </v-btn>
          <v-btn outlined class="mr-4" color="grey darken-2" @click="setToday">
            Today
          </v-btn>
          <v-btn fab text small color="grey darken-2" @click="prev">
            <v-icon small> mdi-chevron-left </v-icon>
          </v-btn>
          <v-btn fab text small color="grey darken-2" @click="next">
            <v-icon small> mdi-chevron-right </v-icon>
          </v-btn>
          <v-toolbar-title v-if="$refs.calendar">
            {{ uppercase($refs.calendar.title) }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-menu bottom right>
            <template v-slot:activator="{ on, attrs }">
              <v-btn outlined color="grey darken-2" v-bind="attrs" v-on="on">
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right> mdi-menu-down </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item
                @click="
                  type = 'day';
                  updateTime();
                "
              >
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <v-list-item
                @click="
                  type = 'week';
                  updateTime();
                "
              >
                <v-list-item-title>Week</v-list-item-title>
              </v-list-item>
              <v-list-item @click="type = 'month'">
                <v-list-item-title>Month</v-list-item-title>
              </v-list-item>
              <v-list-item
                @click="
                  type = '4day';
                  updateTime();
                "
              >
                <v-list-item-title>4 days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>
      </v-sheet>

      <v-dialog v-model="dialog" max-width="500">
        <v-card>
          <v-container fluid>
            <v-form @submit.prevent="addEvent">
              <v-snackbar
                v-model="snackbar"
                :timeout="1600"
                color="deep-orange"
                rounded="pill"
                text
              >
                Please fill in all required fields
              </v-snackbar>
              <v-text-field
                v-model="name"
                type="text"
                label="Event name *"
              ></v-text-field>
              <v-text-field
                v-model="details"
                type="text"
                label="Details"
              ></v-text-field>
              <v-text-field
                v-model="start"
                type="date"
                label="Start date *"
              ></v-text-field>
              <v-text-field
                v-model="end"
                type="date"
                label="End date *"
              ></v-text-field>

              <v-row class="justify-center">
                <v-color-picker
                  class="ma-2"
                  dot-size="30"
                  mode="hexa"
                  hide-mode-switch
                  v-model="color"
                ></v-color-picker
              ></v-row>
              <v-row class="justify-center">
                <v-btn type="submit" color="primary" class="mr-4"
                  >Create event</v-btn
                ></v-row
              >
            </v-form>
          </v-container>
        </v-card>
      </v-dialog>

      <v-sheet height="600">
        <v-calendar
          ref="calendar"
          v-model="focus"
          color="primary"
          :events="events"
          :event-color="getEventColor"
          :type="type"
          @click:event="showEvent"
          @click:more="viewDay"
          @click:date="viewDay"
        >
          <template #day-body="{ date, week }">
            <div
              class="v-current-time"
              :class="{ first: date === week[0].date }"
              :style="{ top: nowY }"
            ></div> </template
        ></v-calendar>

        <v-menu
          v-model="selectedOpen"
          :close-on-content-click="false"
          :activator="selectedElement"
          offset-x
        >
          <v-card color="grey lighten-4" min-width="350px" flat>
            <v-toolbar :color="selectedEvent.color" dark>
              <v-btn icon @click="deleteEvent(selectedEvent.id)">
                <v-icon>mdi-delete</v-icon>
              </v-btn>
              <v-toolbar-title v-html="selectedEvent.name"></v-toolbar-title>
              <v-spacer></v-spacer>
            </v-toolbar>
            <v-card-text>
              <form v-if="currentlyEditing !== selectedEvent.id">
                {{ selectedEvent.details }}
              </form>
              <form v-else>
                <textarea-autosize
                  v-model="selectedEvent.details"
                  type="text"
                  style="width: 100%"
                  :min-height="100"
                  placeholder="Add note"
                ></textarea-autosize>
              </form>
            </v-card-text>
            <v-card-actions>
              <v-btn text color="secondary" @click="selectedOpen = false">
                Close
              </v-btn>
              <v-btn
                text
                color="secondary"
                v-if="currentlyEditing !== selectedEvent.id"
                @click.prevent="editEvent(selectedEvent)"
              >
                Edit
              </v-btn>
              <v-btn
                text
                color="secondary"
                v-else
                @click.prevent="updateEvent(selectedEvent)"
              >
                Save
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </v-sheet>
    </v-col>
  </v-row>
</template>



<script>
import { db } from "@/main";
export default {
  data: () => ({
    today: new Date().toISOString().substr(0, 10),
    focus: new Date().toISOString().substr(0, 10),
    type: "week",
    typeToLabel: {
      month: "Month",
      week: "Week",
      day: "Day",
      "4day": "4 Days",
    },
    name: null,
    details: null,
    start: null,
    end: null,
    color: "#1976D2",
    currentlyEditing: null,
    selectedEvent: {},
    selectedElement: null,
    selectedOpen: false,
    events: [],
    dialog: false,
    snackbar: false,
    ready: false,
  }),
  computed: {
    cal() {
      return this.ready ? this.$refs.calendar : null;
    },
    nowY() {
      return this.cal ? this.cal.timeToY(this.cal.times.now) + "px" : "-10px";
    },
  },
  mounted() {
    this.getEvents();
    this.ready = true;
    this.scrollToTime();
    this.updateTime();
  },
  methods: {
    async getEvents() {
      let snapshot = await db.collection("calendarEvent").get();
      let events = [];
      snapshot.forEach((doc) => {
        let appData = doc.data();
        appData.id = doc.id;
        events.push(appData);
      });

      this.events = events;
    },
    async addEvent() {
      if (this.name && this.start && this.end) {
        await db.collection("calendarEvent").add({
          name: this.name,
          details: this.details,
          start: this.start,
          end: this.end,
          color: this.color,
        });

        this.name = "";
        this.details = "";
        this.start = "";
        this.end = "";
        this.color = "#1976D2";
        this.dialog = false;

        this.getEvents();
      } else {
        this.snackbar = true;
      }
    },
    async updateEvent(event) {
      await db.collection("calendarEvent").doc(this.currentlyEditing).update({
        details: event.details,
      });

      this.selectedOpen = false;
      this.currentlyEditing = null;
    },
    async deleteEvent(event) {
      await db.collection("calendarEvent").doc(event).delete();
      this.selectedOpen = false;
      this.getEvents();
    },
    uppercase(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    viewDay({ date }) {
      this.focus = date;
      this.type = "day";
    },
    getEventColor(event) {
      return event.color;
    },
    setToday() {
      this.focus = this.today;
    },
    prev() {
      this.$refs.calendar.prev();
    },
    next() {
      this.$refs.calendar.next();
    },
    editEvent(event) {
      this.currentlyEditing = event.id;
    },
    showEvent({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event;
        this.selectedElement = nativeEvent.target;
        setTimeout(() => {
          this.selectedOpen = true;
        }, 10);
      };

      if (this.selectedOpen) {
        this.selectedOpen = false;
        setTimeout(open, 10);
      } else {
        open();
      }

      nativeEvent.stopPropagation();
    },
    getCurrentTime() {
      return this.cal
        ? this.cal.times.now.hour * 60 + this.cal.times.now.minute
        : 0;
    },
    scrollToTime() {
      const time = this.getCurrentTime();
      const first = Math.max(0, time - (time % 30) - 30);

      this.cal.scrollToTime(first);
    },
    updateTime() {
      setInterval(() => this.cal.updateTimes(), 60 * 1000);
    },
  },
};
</script>

<style lang="scss">
.v-current-time {
  height: 2px;
  background-color: #ea4335;
  position: absolute;
  left: -1px;
  right: 0;
  pointer-events: none;

  &.first::before {
    content: "";
    position: absolute;
    background-color: #ea4335;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-top: -5px;
    margin-left: -6.5px;
  }
}
</style>