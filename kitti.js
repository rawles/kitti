window.onload = requestFreshData;

function requestFreshData() {
    numFilesLoaded = 0;
    if( true ) {
        getAsync( "http://rawles.github.io/kitti/kittilog.txt", storeLog );
        getAsync( "http://rawles.github.io/kitti/names.txt", storeNames );
    }
    else {
        // useful for local debugging
        storeLog( "2014-07-25T13:30  FB20F15B     Bedouin lunch\n2014-07-29T21:10  JFB16.48B2F  Cherry Box Pizza on film night\n2014-07-31T20:30  BF8F         Cambridge Blue (Benediktiner Weissbier)\n2014-07-31T22:00  BP36.60P     Imaginary Sushi" );
        storeNames( "FrkiMnkiTurtle:F,M,T\nRickPaul:R,P\nBear:B\nPup:J\n" );
        processData();
    }
}

function getAsync( url, callback ) {
    var http = new XMLHttpRequest();
    // need to always request a different URL to avoid getting a cached copy
    http.open( 'GET', url + ((/\?/).test(url) ? "&" : "?") + (new Date()).getTime(), true );
    http.onreadystatechange = function() {
        if( http.readyState==4 && http.status==200 ) {
            callback( http.responseText );
            checkAllLoaded();
        }
    };
    http.send();
}

function storeLog( text ) {
    log_lines = text.split("\n");
}

function storeNames( text ) {
    people = new Object();
    names = new Array();
    known_identifiers = new Array();
    name_lines = text.split("\n");
    person_index = 0;
    for( var i = 0; i < name_lines.length; ++i ) {
        var entries = name_lines[i].split(/[:,]/);
        if( entries.length < 2 ) continue;
        var full_name = entries[0];
        people[ full_name ] = new Object();
        people[ full_name ].full = full_name;
        people[ full_name ].credit = 0.0;
        people[ full_name ].index = person_index;
        people[ full_name ].abbreviations = entries.slice(1,entries.length);
        people[ full_name ].present = true;
        person_index++;
        names.push( full_name );
        for( var j = 1; j < entries.length; ++j ) {
            people[ entries[ j ] ] = people[ full_name ];
            known_identifiers.push( entries[ j ] );
        }
    }
}

function checkAllLoaded() {
    numFilesLoaded += 1;
    if( numFilesLoaded == 2 ) {
        retrieveUserSubset();
        processData();
    }
}

function processData() {
    // clear results
    total_transactions = 0;
    num_transactions = 0;
    for( var i_name in names ) {
        var person = names[ i_name ];
        people[ person ].credit = 0.0;
    }
    transition_matrix = matrix_zeros( names.length );
    
    var log_html="";
    if( !noneInSubset() ) {
        log_html = "<hr><h2>Parsed transactions"
        if( !allInSubset() ) {
            var included = getUserSubsetAsString();
            log_html += " (those involving only "+included+")";
        }
        log_html += "</h2>\n<dl>\n";
        for( var i in log_lines ) {
            var line = log_lines[i];
            var comments = parseLine( line );
            if( comments ) {
                log_html += "<dt><code>"+line+"</code></dt>\n";
                for ( var comment in comments ) {
                    log_html += "<dd>"+comments[comment]+"</dd>\n";
                }
            }
        }
        log_html += "</dl>";
    }
    computeTransitionMatrix();
    computeFlowMatrix();
    document.getElementById("currentStatus").innerHTML = printStatus();
    document.getElementById("log").innerHTML = log_html;
    drawThings()
}

function parseLine( line ) {

    if( !line.match( /\S/g ) ) {
        return; // blank line, ignore
    }

    var comments = new Array();

    var allowed_identifiers = "(?:" + known_identifiers.join('|') + ")";
    var allowed_currencies = "[DE]";
    var float_match = "([\\d\\.]+)";
    var percentage_or_amount = "(?:" + float_match + "(?:\\%)|" + float_match + ")"; // float% or float
    var bracketed_percentage_or_amount = "(?:\\(" + percentage_or_amount + "\\)|\\[" + percentage_or_amount + "\\])"; // (val) or [val]
    var debtor_match = "(" + allowed_identifiers + ")(?:" + bracketed_percentage_or_amount + ")?";
    var creditor_match = "(" + allowed_currencies + ")?(?:" + float_match + ")(" + allowed_identifiers + ")";
    var transaction_match = "(" + debtor_match + ")|(" + creditor_match + ")";
    var line_match = "^(?:\\S+\\s+)(\\S+)(?:\\s+)(.+)$";

    var line_tokens = line.match( new RegExp( line_match ) );
    if( !line_tokens || line_tokens.length != 3 ) {
        comments.push( 'ERROR: Failed to parse this line at all.' );
        return comments;
    }
    var transaction = line_tokens[1];
    var description = line_tokens[2];
    var transaction_tokens = transaction.match( new RegExp( transaction_match, "gi" ) );
    if( !transaction_tokens || transaction_tokens.length < 2 ) {
        comments.push( 'ERROR: Failed to parse this transaction: '+transaction+' using regexp: '+transaction_match );
        return comments;
    }

    // exclude transactions that involve people not present
    for( var j in transaction_tokens ) {
        var token = transaction_tokens[j];
        var creditor_subtokens = token.match( new RegExp( creditor_match, "i" ) );
        var debtor_subtokens = token.match( new RegExp( debtor_match, "i" ) );
        if( (creditor_subtokens && !people[ creditor_subtokens[3] ].present) ||
            (debtor_subtokens && !people[ debtor_subtokens[1] ].present) ) {
                return "";
        }
    }

    var totalCredited = 0.0;
    var weightedDebtors = new Object();
    var totalWeighting = 0.0;
    var fixedDebtors = new Object();
    var creditors = [];
    for( var j in transaction_tokens ) {
        var token = transaction_tokens[j];
        var creditor_subtokens = token.match( new RegExp( creditor_match, "i" ) );
        var debtor_subtokens = token.match( new RegExp( debtor_match, "i" ) );
        if( creditor_subtokens ) {
            // this is an amount credited
            creditCurrency = creditor_subtokens[1];
            if( creditCurrency ) {
                comments.push( 'ERROR: Cannot process foreign currency in this version!' );
                return comments;
            }
            creditAmount = parseFloat( creditor_subtokens[2] );
            identifier = creditor_subtokens[3];
            people[ identifier ].credit += creditAmount;
            totalCredited += creditAmount;
            creditors.push( identifier );
            comments.push( '<em>Credit:</em> '+identifier+' ('+people[identifier].full+') gets +'+creditAmount.toFixed(2)+'GBP.' );
        }
        else if( debtor_subtokens ) {
            identifier = debtor_subtokens[1];
            percentage = parseFloat( debtor_subtokens[2] );
            debitAmount1 = parseFloat( debtor_subtokens[3] );
            debitAmount2 = parseFloat( debtor_subtokens[5] );
            if( debitAmount1 || debitAmount2 ) {
                if( debitAmount1 ) {
                    fixedDebtors[ identifier ] = debitAmount1; // (don't debit yet in case currency is not gbp)
                }
                else {
                    fixedDebtors[ identifier ] = debitAmount2; // (don't debit yet in case currency is not gbp)
                }
            }
            else if( percentage ) {
                var weight = percentage / 100.0;
                totalWeighting += weight;
                weightedDebtors[ identifier ] = weight;
            }
            else {
                var weight = 1.0;
                totalWeighting += weight;
                weightedDebtors[ identifier ] = weight;
            }
        }
    }
    
    var remainingDebt = totalCredited;
    for( var identifier in fixedDebtors ) {
        var debitAmount = fixedDebtors[ identifier ];
        people[ identifier ].credit -= debitAmount;
        remainingDebt -= debitAmount;
        comments.push( '<em>Debit</em>: '+identifier+' ('+people[identifier].full+') gets -'+debitAmount.toFixed(2)+'GBP (fixed amount).' );
    }
    var unitDebt = remainingDebt / totalWeighting;
    for( var identifier in weightedDebtors ) {
        var weight = weightedDebtors[ identifier ];
        var debitAmount = unitDebt * weight;
        people[ identifier ].credit -= debitAmount;
        comments.push( '<em>Debit</em>: '+identifier+' ('+people[identifier].full+') gets -'+debitAmount.toFixed(2)+'GBP (share weighted by '+weight.toFixed(2)+').' );
    }
    incrementTransactionMatrix( totalCredited, creditors, fixedDebtors, weightedDebtors );
    total_transactions += totalCredited;
    num_transactions += 1;
    return comments;
}

function incrementTransactionMatrix( totalCredited, creditors, fixedDebtors, weightedDebtors ) {
    // each pair of people involved gets their connection strengthened by totalCredited
    // (could consider weightings, fixed amounts, people who paid for their share)
    var people_involved = [];
    for( var identifier in creditors ) {
        iPerson = people[ creditors[ identifier ] ].index;
        if( people_involved.indexOf( iPerson ) == -1 )
            people_involved.push( iPerson );
    }
    for( var identifier in fixedDebtors ) {
        iPerson = people[ identifier ].index;
        if( people_involved.indexOf( iPerson ) == -1 )
            people_involved.push( iPerson );
    }
    for( var identifier in weightedDebtors ) {
        iPerson = people[ identifier ].index;
        if( people_involved.indexOf( iPerson ) == -1 )
            people_involved.push( iPerson );
    }
    for( var i in people_involved ) {
        var pi = people_involved[ i ];
        for( var j in people_involved ) {
            if( j<=i ) { continue; }
            var pj = people_involved[ j ];
            if( pi == pj ) { continue; } // not interested in self-transactions here
            transition_matrix[ pi ][ pj ] += totalCredited;
            transition_matrix[ pj ][ pi ] += totalCredited;
        }
    }
}

function computeTransitionMatrix() {
    var N = transition_matrix.length;
    // normalize the transactions matrix
    var edgeTotal = 0.0;
    for( var i = 0; i < N; ++i ) {
        for( var j = i+1; j < N; ++j ) {
            edgeTotal += transition_matrix[i][j];
        }
    }
    transition_matrix = matrix_times_scalar( transition_matrix, 1.0 / edgeTotal );
    // fill the diagonal with the remaining 'stay-here' probability
    column_totals = matrix_sum( transition_matrix );
    for( var i = 0; i < N; ++i ) {
        transition_matrix[i][i] = 1.0 - column_totals[i];
    }
}

function computeFlowMatrix() {
    // given N people's credit/debit value and the assumption that the flow of credit will
    // be as seen in the historical record, what are the debt flows that will happen to 
    // cancel everything out?
    var N = transition_matrix.length;
    var e = matrix_zeros( N );
    clearing_cost = 0.0;
    v = [];
    for( var i in names ) {
        v[ i ] = people[ names[ i ] ].credit;
    }
    for( var it = 0; it < 10000; ++it ) {
        vm = matrix_times( matrix_diag( v ), transition_matrix );
        e = matrix_add( e, vm );
        v = matrix_sum( vm );
        for( var i in v ) {
            clearing_cost += Math.abs( v[i] );
        }
    }
    clearing_cost /= total_transactions / log_lines.length; // convert pound-transactions into transactions
    e = matrix_add( e, matrix_times_scalar( matrix_transpose( e ), -1.0 ) );
    flow_matrix = matrix_times_scalar( e, -1.0 );
}

function handleToggle(person_full) {
    people[ person_full ].present = !people[ person_full ].present;
    processData();
}

function includeAllInSubset() {
    for( var i_name in names ) {
        var person = names[ i_name ];
        people[ person ].present = true;
    }
    processData();
}

function includeNoneInSubset() {
    for( var i_name in names ) {
        var person = names[ i_name ];
        people[ person ].present = false;
    }
    processData();
}

function allInSubset() {
    for( var i_name in names ) {
        var person = names[ i_name ];
        if( !people[ person ].present ) { return false; }
    }
    return true;
}

function noneInSubset() {
    for( var i_name in names ) {
        var person = names[ i_name ];
        if( people[ person ].present ) { return false; }
    }
    return true;
}

function getUserSubsetAsString() {
    var included = [];
    for( var i_name in names ) {
        var person = names[ i_name ];
        if( people[ person ].present ) {
            included.push( people[ person ].abbreviations );
        }
    }
    return included.join(',');
}

function printStatus() {
    var html = "";

    if(allInSubset()) {
        html += "<p>Currently showing all transactions because everybody is included. "
             +  " <a href=\"javascript:includeNoneInSubset();\">Remove all.</a>";
    }
    else if(noneInSubset()) {
        html += "<p>Currently showing no transactions because nobody is included. "
             +  "<a href=\"javascript:includeAllInSubset();\">Include all.</a>";
    }
    else {
        var included = getUserSubsetAsString();
        html += "<p>Currently showing only transactions that involve " + included + ". "
             +  "<a href=\"javascript:includeAllInSubset();\">Include all.</a> "
             +  "<a href=\"javascript:includeNoneInSubset();\">Remove all.</a>";
    }

    html +="<table>\n<tr><th></th><th>Person</th><th colspan=\"2\" class=\"number\">Kitti owes</th></tr>\n";
    for( var i in names ) {
        var person = people[ names[ i ] ];
        var number_css_class = "number-currency-positive";
        if ( person.credit < 0 ) {
                number_css_class = "number-currency-negative";
        }
        html += "<tr>"
             + "<td><label class=\"switch\"><input type=\"checkbox\" checked onchange=\"handleToggle(&quot;"+person.full+"&quot;);\"><span class=\"slider round\"></span></label></td>"
             + "<td>" + person.full + "</td><td>"
             + String.fromCharCode(163) + "</td><td class=\"" + number_css_class + "\">" + person.credit.toFixed(2) + "</td></tr>";
    }
    html += "</table>";
    
    html += "<p>Total borrowed off each other: "+String.fromCharCode(163)+total_transactions.toFixed(2)+", over "+num_transactions+" transactions. ";
    
    html += "Expected transactions for debt to clear, if they follow the same pattern: "+clearing_cost.toFixed(1)+"</p>";
    
    /*
    html += "<h2>Flow matrix:</h2>";
    html += "<p>(how the debt will clear, if the transactions are along historical lines)</p>";
    html += "<table border=\"1\"><tr><td></td>";
    for( var row in flow_matrix ) {
        html += "<td>to "+names[row]+"</td>";
    }
    html += "</tr>";
    for( var row in flow_matrix ) {
        html += "<tr><td> from "+names[row]+"</td><td>"+flow_matrix[row].map(function(x){ return x.toFixed(2); }).join("</td><td>") + "</td></tr>";
    }
    html += "</table>";

    html += "<h2>Transition matrix:</h2>";
    html += "<p>(shows how much money has flowed between people, on average)</p>";
    html += "<table border=\"1\">";
    for( var row in transition_matrix ) {
        html += "<tr><td>"+transition_matrix[row].map(function(x){ return x.toFixed(2); }).join("</td><td>") + "</td></tr>";
    }
    html += "</table>";
    */

    return html;
}

function retrieveUserSubset() {
    /*try {
        filter_users_string = localStorage.getItem("filter_users");
        if(filter_users_string=="") {
            filter_users = [];
        }
        else {
            filter_users = filter_users_string.split(',');
        }
    } catch(e) {
        filter_users = [];
        console.log("Error getting localStorage:",e);
    }*/
}

function storeUserSubset() {
    /*try {
        localStorage.setItem("filter_users",f);
    } catch(e) {
        console.log("Error setting localStorage:",e);
    }
    if(f=="") {
        filter_users = [];
    }
    else {
        filter_users = f.split(',');
    }
    processData();*/
}

function drawThings() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = 'middle';

    // for now, draw people in a circle, with lines between them
    var radius = ctx.canvas.height / 3;
    var cx1 = ctx.canvas.width / 4;
    var cx2 = 3 * ctx.canvas.width / 4;
    var cy = ctx.canvas.height / 2;
    var x1 = [];
    var x2 = [];
    var y = [];
    for( var iPerson = 0; iPerson < names.length; ++iPerson ) {
        var theta = iPerson * 2*Math.PI / names.length;
        x1[iPerson] = cx1 + radius * Math.cos( theta );
        x2[iPerson] = cx2 + radius * Math.cos( theta );
        y[iPerson] = cy + radius * Math.sin( theta );
    }
    for( var iPerson = 0; iPerson < names.length; ++iPerson ) {
        for( var jPerson = 0; jPerson < names.length; ++jPerson ) {
            var pipe_width = transition_matrix[iPerson][jPerson];
            if( jPerson > iPerson && pipe_width > 0.0 ) {
                ctx.strokeStyle = "rgb(200,200,200)";
                ctx.lineWidth =  pipe_width *20.0 + 1.0;
                canvas_arrow( ctx, x1[iPerson], y[iPerson], x1[jPerson], y[jPerson], false );
                ctx.fillStyle = "rgba(0,0,0,0.9)";
                ctx.font = "9px Arial";
                ctx.fillText( pipe_width.toFixed(2), (x1[iPerson]+x1[jPerson])/2.0, (y[iPerson]+y[jPerson])/2.0 );
            }
            var flow_val = flow_matrix[iPerson][jPerson];
            if( flow_val > 1.0 ) {
                ctx.strokeStyle = "rgb(200,200,200)";
                ctx.lineWidth =  Math.log( flow_val )*2.0 + 1;
                canvas_arrow( ctx, x2[iPerson], y[iPerson], x2[jPerson], y[jPerson], true );
                ctx.fillStyle = "rgba(0,0,0,0.9)";
                ctx.font = "9px Arial";
                ctx.fillText( String.fromCharCode(163)+flow_val.toFixed(0), (x2[iPerson]+x2[jPerson])/2.0, (y[iPerson]+y[jPerson])/2.0 );
            }
        }
    }
    var blobR = 10;
    for( var iPerson = 0; iPerson < names.length; ++iPerson ) {
        var credit = people[ names[ iPerson ] ].credit;
        if( credit > 0 ) {
            ctx.fillStyle = "rgba(0,200,0,0.4)"; 
        }
        else {
            ctx.fillStyle = "rgba(200,0,0,0.4)"; 
        }
        ctx.beginPath();
        ctx.arc(x1[iPerson],y[iPerson],blobR,0,2*Math.PI);
        ctx.arc(x2[iPerson],y[iPerson],blobR,0,2*Math.PI);
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,1.0)";
        ctx.font = "14px Arial";
        ctx.fillText( people[ names[ iPerson ] ].full, x1[iPerson], y[iPerson]-blobR*3 );
        ctx.fillText( people[ names[ iPerson ] ].full, x2[iPerson], y[iPerson]-blobR*3 );
    }
}

// adapted from http://stackoverflow.com/a/6333775/126823
function canvas_arrow(context, fromx, fromy, tox, toy, draw_arrow){
    var headlen = 10; // length of head in pixels
    var end_gap = 20; // distance of head and tail from requested positions
    var angle = Math.atan2(toy-fromy,tox-fromx);
    fromx += end_gap * Math.cos(angle);
    fromy += end_gap * Math.sin(angle);
    tox -= end_gap * Math.cos(angle);
    toy -= end_gap * Math.sin(angle);
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();
    if( draw_arrow ) {
        context.beginPath();
        context.moveTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
        context.lineTo(tox, toy);
        context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
        context.stroke();
    }
}
