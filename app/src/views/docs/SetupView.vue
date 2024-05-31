<template>
  <v-card variant="elevated" class="mx-6 mt-13">
    <v-card-title class="font-weight-black">Setup</v-card-title>
    <v-card-text class="text-body-1">
      CronMon monitors the execution of your cronjobs and tasks, and alerts you when something goes
      wrong. It can be used to monitor any type of cronjob or task, from simple scripts to complex
      applications. For example, you might have a job that runs every 5 minutes to check that your
      website is up and running, or perhaps you have a script that runs once a day to back up your
      database. You can even use CronMon to monitor certain functions within your application that
      are invoked adhoc, rather than on a schedule.
      <br />
      <br />
      To get started with CronMon, you need to set up a <i>Monitor</i>. A Monitor is responsible for
      monitoring the execution of a specific cronjob or task that you want to track, and reporting
      any issues or failures that occur when it runs. A Monitor <i>contains</i> Jobs, which are a
      record of a single exuectuion of the cronjob or task being monitored. Each time the cronjob or
      task <i>starts</i>, a new Job is created and in the Monitor.
      <br />
      <br />
      To create a Monitor, go to
      <router-link :to="{ name: 'monitors' }" target="_blank">Monitors</router-link> and click the
      "Add Monitor" button. You'll be asked to provide some basic information about the monitor,
      such as its name, how long you expect its jobs to run for, and how much grace to give the jobs
      before considering them late.
      <br />
      <br />
      <v-img
        class="mx-auto"
        max-width="800px"
        src="/src/assets/monitor-setup.gif"
        alt="Monitor setup"
      />
      <br />
      <v-alert type="info" dense variant="tonal">
        A Job is considered <i>late</i> when it hasn't finished within the <i>expected</i> time plus
        the <i>grace</i> time. When a Job becomes late it will be marked as such and you will be
        alerted. Late Jobs can, and should, still be finished - there is a difference between late
        Jobs that <i>never</i> finish, and late Jobs that <i>do</i>.
      </v-alert>
      <br />
      Once you've set up your Monitor(s), you can integrate CronMon with your cronjobs and
      applications. Take a look at
      <router-link :to="{ name: 'docs-integration' }">the integration docs</router-link>
      to see how you can use CronMon in your code using various programming languages.
    </v-card-text>
  </v-card>
</template>
