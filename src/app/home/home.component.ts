import {Component, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {ScoreCard,ScorecardService} from "../shared/services/scorecard.service";
import {OrgUnitService} from "../shared/services/org-unit.service";
import {DataService} from "../shared/data.service";
import {TreeNode, TREE_ACTIONS, IActionMapping, TreeComponent} from 'angular2-tree-component';
import {FilterService} from "../shared/services/filter.service";
import {CardWidgetService, ScoreCardWidget} from "../shared/services/card-widget.service";

const actionMapping:IActionMapping = {
  mouse: {
    click: (node, tree, $event) => {
      $event.ctrlKey
        ? TREE_ACTIONS.TOGGLE_SELECTED_MULTI(node, tree, $event)
        : TREE_ACTIONS.TOGGLE_SELECTED(node, tree, $event)
    }
  }
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {

  scorecards: ScoreCard[];
  scorecards_loading: boolean;
  complete_percent: number;
  total: number = 0;
  loading_message:string;
  queryterm: string = null;
  deleting: boolean[] = [];
  deleted: boolean[] = [];
  error_deleting: boolean[] = [];
  confirm_deleting: boolean[] = [];
  in_dashboard: boolean = false;
  current_dashboard_item: string;

  // orgunit and period selections
  orgUnit: any = {};
  period: any = {};
  orgunit_tree_config: any = {
    show_search : true,
    search_text : 'Search',
    level: null,
    loading: false,
    loading_message: 'Loading Organisation units...',
    multiple: true,
    placeholder: "Select Organisation Unit"
  };

  period_tree_config: any = {
    show_search : true,
    search_text : 'Search',
    level: null,
    loading: false,
    loading_message: 'Loading Periods...',
    multiple: true,
    placeholder: "Select period"
  };
  organisationunits: any[] = [];
  selected_orgunits: any[] = [];
  selected_periods:any[] = [];
  periods: any[] = [];
  period_type: string = "Quarterly";
  year: number = 2016;
  showOrgTree:boolean = true;
  showPerTree:boolean = true;

  @ViewChild('orgtree')
  orgtree: TreeComponent;

  @ViewChild('pertree')
  pertree: TreeComponent;

  selected_scorecard: string;
  dashboardAvaible: boolean = false;
  dashboardLoading: boolean = false;


  show_rank: boolean = false;
  no_scorecardApp:boolean = false;

  orgUnitlength:number = 0;
  metadata_ready = false;

  orgunit_model: any = {
    selection_mode: "orgUnit",
    selected_level: "",
    selected_group: "",
    orgunit_levels: [],
    orgunit_groups: [],
    selected_orgunits: [],
    user_orgunits: [],
    selected_user_orgunit: "USER_ORGUNIT"
  };
  constructor( private scoreCardService: ScorecardService,
               private dataService: DataService,
               private filterService: FilterService,
               private orgunitService: OrgUnitService,
               private cardWidgetService: CardWidgetService
  ) {
    this.scorecards = [];
    this.scorecards_loading = true;
    this.complete_percent = 0;
    this.loading_message = "Loading First Score card";
    // Get the dashboardItemId query parameter from the URL

    //setting period and loading default period
    this.periods = this.filterService.getPeriodArray( this.period_type, this.year );
    this.period = {
      id:this.filterService.getPeriodArray( this.period_type, this.year )[0].id,
      name:this.filterService.getPeriodArray( this.period_type, this.year )[0].name
    };
  }

  ngOnInit() {
    this.scoreCardService.loadAll().subscribe(
      scorecards => {
        this.no_scorecardApp = false;
        var dashboardItemId = (/[?&]dashboardItemId=([a-zA-Z0-9]{11})(?:&|$)/g
          .exec(window.location.search) || [undefined]).pop();
        if(dashboardItemId){
          this.in_dashboard = false;
          this.current_dashboard_item = dashboardItemId;
          this.dashboardLoading = true;
          this.cardWidgetService.load(dashboardItemId).subscribe(
            (data) => {
              this.dashboardAvaible = true;
              this.dashboardLoading = false;
            },error => {
              let scorecard_count = 0;
              for( let scorecard of scorecards ){
                // loading scorecard details
                this.scoreCardService.load(scorecard).subscribe(
                  scorecard_details => {
                    this.loading_message = "Loading data for "+scorecard_details.header.title;
                    this.scorecards.push({
                      id: scorecard,
                      name: scorecard_details.header.title,
                      data: scorecard_details
                    });
                    this.dataService.sortArrOfObjectsByParam(this.scorecards, 'name',true);
                    scorecard_count ++;
                    // set loading equal to false when all scorecards are loaded
                    if(scorecard_count == this.scorecards.length){
                      this.loading_message = "Done loading all score cards";
                      this.scorecards_loading = false;
                    }
                    this.complete_percent = (scorecard_count/this.scorecards.length)*100
                  },
                  // catch error if anything happens when loading scorecard details
                  detail_error => {
                    this.loading_message = "Error Occurred while loading scorecards";
                    this.scorecards_loading = false;
                  }
                )
              }

              if (this.orgunitService.nodes == null) {
                this.orgunitService.getOrgunitLevelsInformation()
                  .subscribe(
                    (data: any) => {
                      // assign urgunit levels and groups to variables
                      this.orgunit_model.orgunit_levels = data.organisationUnitLevels;
                      this.orgunitService.getOrgunitGroups().subscribe( groups => {//noinspection TypeScriptUnresolvedVariable
                        this.orgunit_model.orgunit_groups = groups.organisationUnitGroups
                      });

                      this.orgunitService.getUserInformation().subscribe(
                        userOrgunit => {
                          let level = this.orgunitService.getUserHighestOrgUnitlevel( userOrgunit );
                          this.orgunit_model.user_orgunits = this.orgunitService.getUserOrgUnits( userOrgunit );
                          let all_levels = data.pager.total;
                          let orgunits = this.orgunitService.getuserOrganisationUnitsWithHighestlevel( level, userOrgunit );
                          let use_level = parseInt(all_levels) - (parseInt(level) - 1);
                          this.orgunit_model.user_orgunits = orgunits;

                          //load inital orgiunits to speed up loading speed
                          this.orgunitService.getInitialOrgunitsForTree(orgunits).subscribe(
                            (initial_data) => {
                              //noinspection TypeScriptUnresolvedVariable
                              this.orgUnit = {
                                id: initial_data.organisationUnits[0].id,
                                name: initial_data.organisationUnits[0].name,
                                children: initial_data.organisationUnits[0].children
                              };
                              this.orgunit_model.selected_orgunits = [this.orgUnit];
                              this.orgUnitlength = this.orgUnit.children.length+1;
                              // this.metadata_ready = true;
                              //noinspection TypeScriptUnresolvedVariable
                              this.organisationunits = initial_data.organisationUnits;
                              this.orgunit_tree_config.loading = false;
                              // after done loading initial organisation units now load all organisation units
                              let fields = this.orgunitService.generateUrlBasedOnLevels(use_level);
                              this.orgunitService.getAllOrgunitsForTree1(fields, orgunits).subscribe(
                                items => {
                                  //noinspection TypeScriptUnresolvedVariable
                                  this.organisationunits = items.organisationUnits;
                                  //noinspection TypeScriptUnresolvedVariable
                                  this.orgunitService.nodes = items.organisationUnits;
                                  this.activateNode(this.orgUnit.id, this.orgtree);
                                  this.prepareOrganisationUnitTree(this.organisationunits, 'parent');
                                },
                                error => {
                                  console.log('something went wrong while fetching Organisation units');
                                  this.orgunit_tree_config.loading = false;
                                }
                              )
                            },
                            error => {
                              console.log('something went wrong while fetching Organisation units');
                              this.orgunit_tree_config.loading = false;
                            }
                          )

                        }
                      )
                    }
                  );
              }
              else {
                this.orgunit_tree_config.loading = false;
                this.orgUnit = {
                  id: this.orgunitService.nodes[0].id,
                  name: this.orgunitService.nodes[0].name,
                  children: this.orgunitService.nodes[0].children
                };
                this.orgunit_model.selected_orgunits = [this.orgUnit];
                this.orgUnitlength = this.orgUnit.children.length+1;
                this.organisationunits = this.orgunitService.nodes;
                this.orgunit_model.orgunit_levels = this.orgunitService.orgunit_levels;
                this.orgunitService.getOrgunitGroups().subscribe( groups => {//noinspection TypeScriptUnresolvedVariable
                  this.orgunit_model.orgunit_groups = groups.organisationUnitGroups
                });
                this.activateNode(this.orgUnit.id, this.orgtree);
                this.prepareOrganisationUnitTree(this.organisationunits, 'parent');
                // TODO: make a sort level information dynamic
                this.metadata_ready = true;
                // this.loadScoreCard();
              }
              this.dashboardAvaible = false;
              this.dashboardLoading = false;
            }
          )
        }else{
          this.in_dashboard = true;
        }
      }, error =>{
        //error loading scorecard.. tell user to install scorecard APP
        this.no_scorecardApp = true;
        console.log('SOME ERROR OCCURRED');
        this.loading_message = "Error Occurred while loading scorecards";
        this.scorecards_loading = false;
      }
    )
  }

  // this function is used to sort organisation unit
  prepareOrganisationUnitTree(organisationUnit,type:string='top') {
    if (type == "top"){
      if (organisationUnit.children) {
        organisationUnit.children.sort((a, b) => {
          if (a.name > b.name) {
            return 1;
          }
          if (a.name < b.name) {
            return -1;
          }
          // a must be equal to b
          return 0;
        });
        organisationUnit.children.forEach((child) => {
          this.prepareOrganisationUnitTree(child,'top');
        })
      }
    }else{
      organisationUnit.forEach((orgunit) => {
        console.log(orgunit);
        if (orgunit.children) {
          orgunit.children.sort((a, b) => {
            if (a.name > b.name) {
              return 1;
            }
            if (a.name < b.name) {
              return -1;
            }
            // a must be equal to b
            return 0;
          });
          orgunit.children.forEach((child) => {
            this.prepareOrganisationUnitTree(child,'top');
          })
        }
      });
    }
  }

// prepare a proper name for updating the organisation unit display area.
  getProperPreOrgunitName() : string{
    let name = "";
    if( this.orgunit_model.selection_mode == "Group" ){
      let use_value = this.orgunit_model.selected_group.split("-");
      for( let single_group of this.orgunit_model.orgunit_groups ){
        if ( single_group.id == use_value[1] ){
          name = single_group.name + " in";
        }
      }
    }else if( this.orgunit_model.selection_mode == "Usr_orgUnit" ){
      if( this.orgunit_model.selected_user_orgunit == "USER_ORGUNIT") name = "User org unit";
      if( this.orgunit_model.selected_user_orgunit == "USER_ORGUNIT_CHILDREN") name = "User sub-units";
      if( this.orgunit_model.selected_user_orgunit == "USER_ORGUNIT_GRANDCHILDREN") name = "User sub-x2-units";
    }else if( this.orgunit_model.selection_mode == "Level" ){
      let use_level = this.orgunit_model.selected_level.split("-");
      for( let single_level of this.orgunit_model.orgunit_levels ){
        if ( single_level.level == use_level[1] ){
          name = single_level.name + " in";
        }
      }
    }else{
      name = "";
    }
    return name
  }

  ngAfterViewInit(){
    this.activateNode(this.period.id, this.pertree);


  }

  // move period one step forward
  pushPeriodForward(){
    this.year += 1;
    this.periods = this.filterService.getPeriodArray(this.period_type,this.year);
  }

  // move period one step backward
  pushPeriodBackward(){
    this.year -= 1;
    this.periods = this.filterService.getPeriodArray(this.period_type,this.year);
  }

  // react to changes in period type changes
  changePeriodType(){
    this.periods = this.filterService.getPeriodArray(this.period_type,this.year);
  }

  // display Orgunit Tree
  displayOrgTree(){
    this.showOrgTree = !this.showOrgTree;
  }

  // display period Tree
  displayPerTree(){
    this.showPerTree = !this.showPerTree;
  }

  // action to be called when a tree item is deselected(Remove item in array of selected items
  deactivateOrg ( $event ) {
    console.log($event.node.data);
    this.orgunit_model.selected_orgunits.forEach((item,index) => {
      if( $event.node.data.id == item.id ) {
        this.orgunit_model.selected_orgunits.splice(index, 1);
      }
    });
  };

  // add item to array of selected items when item is selected
  activateOrg = ($event) => {
    this.selected_orgunits = [$event.node.data];
    if(!this.checkOrgunitAvailabilty($event.node.data, this.orgunit_model.selected_orgunits)){
      this.orgunit_model.selected_orgunits.push($event.node.data);
    }
    this.orgUnit = $event.node.data;
  };

  // check if orgunit already exist in the orgunit display list
  checkOrgunitAvailabilty(orgunit, array): boolean{
    let checker = false;
    array.forEach((value) => {
      if( value.id == orgunit.id ){
        checker = true;
      }
    });
    return checker;
  }


  // add item to array of selected items when item is selected
  activatePer = ($event) => {
    this.selected_periods = [$event.node.data];
    this.period = $event.node.data;
  };

  activateNode(nodeId:any, nodes){
    setTimeout(() => {
      let node = nodes.treeModel.getNodeById(nodeId);
      if (node)
        node.toggleActivated();
    }, 0);
  }

  // action to be called when a tree item is deselected(Remove item in array of selected items
  deactivatePer ( $event ) {

  };

  // function that is used to filter nodes
  filterNodes(text, tree) {
    tree.treeModel.filterNodes(text, true);
  }

  getPeriodName(id){
    for ( let period of this.filterService.getPeriodArray(this.period_type, this.filterService.getLastPeriod(id,this.period_type).substr(0,4))){
      if( this.filterService.getLastPeriod(id,this.period_type) == period.id){
        return period.name;
      }
    }
  }

  //setting the period to next or previous
  setPeriod(type){
    if(type == "down"){
      this.periods = this.filterService.getPeriodArray(this.period_type, this.filterService.getLastPeriod(this.period.id,this.period_type).substr(0,4));
      this.activateNode(this.filterService.getLastPeriod(this.period.id,this.period_type), this.pertree);
      this.period = {
        id:this.filterService.getLastPeriod(this.period.id,this.period_type),
        name:this.getPeriodName(this.filterService.getLastPeriod(this.period.id,this.period_type))
      };
    }
    if(type == "up"){
      this.periods = this.filterService.getPeriodArray(this.period_type, this.filterService.getNextPeriod(this.period.id,this.period_type).substr(0,4));
      this.activateNode(this.filterService.getNextPeriod(this.period.id,this.period_type), this.pertree);
      this.period = {
        id:this.filterService.getNextPeriod(this.period.id,this.period_type),
        name:this.getPeriodName(this.filterService.getNextPeriod(this.period.id,this.period_type))
      };
    }
  }

  // custom settings for tree
  customTemplateStringOptions: any = {
    isExpandedField: 'expanded',
    actionMapping
  };
  saving:boolean = false;
  saveDashbordItem(){
    this.saving = true;
    let widget = {
      dashboardId:this.current_dashboard_item,
      scoreCardId:this.selected_scorecard,
      periodType:this.period_type,
      period:this.period,
      organisation_unit:this.orgunit_model
    };
    let scoreCardWidget: ScoreCardWidget = {
      id: this.current_dashboard_item,
      data: widget
    };
    this.cardWidgetService.create(scoreCardWidget).subscribe(
      (data) => {
        this.saving = false;
        this.dashboardAvaible = true

      }, error =>{
        this.saving = false;
      }
    );
  }


}
